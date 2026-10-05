import postgres from "postgres";
import { buildIndex } from "./index-shape.js";

const ALLOW_ORIGIN = "https://strunden.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  });
}

function connectionOf(env) {
  const hyperdrive = env.HYPERDRIVE && env.HYPERDRIVE.connectionString;
  if (hyperdrive) return { url: hyperdrive, viaHyperdrive: true };
  if (env.DATABASE_URL) return { url: env.DATABASE_URL, viaHyperdrive: false };
  return null;
}

function openSql(conn) {
  const options = {
    max: conn.viaHyperdrive ? 5 : 1,
    fetch_types: false,
    prepare: conn.viaHyperdrive,
    connect_timeout: 15,
  };
  if (!conn.viaHyperdrive) options.ssl = "require";
  return postgres(conn.url, options);
}

async function withSql(env, fn) {
  const conn = connectionOf(env);
  if (!conn) {
    const error = new Error("database unconfigured");
    error.code = "UNCONFIGURED";
    throw error;
  }
  const sql = openSql(conn);
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function readIndex(env) {
  return withSql(env, async (sql) => {
    const metaRows = await sql`
      SELECT schema_version,
             to_char(generated, 'YYYY-MM-DD') AS generated,
             title
      FROM atlas_meta
      LIMIT 1
    `;
    const changelog = await sql`
      SELECT to_char(entry_date, 'YYYY-MM-DD') AS date, text
      FROM changelog
      ORDER BY position ASC, id ASC
    `;
    const entryRows = await sql`
      SELECT document
      FROM entries
      ORDER BY position ASC, id ASC
    `;
    return buildIndex(
      metaRows[0] || null,
      changelog,
      entryRows.map((row) => row.document),
    );
  });
}

function dbError(error) {
  console.error(
    JSON.stringify({
      message: "database query failed",
      code: error && error.code ? error.code : "unknown",
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  if (error && error.code === "UNCONFIGURED") {
    return json({ ok: false, error: "database unconfigured" }, 503);
  }
  return json({ ok: false, error: "database error" }, 503);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS" && (path === "/api/index" || path === "/api/health")) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET") {
      return json({ ok: false, error: "method not allowed" }, 405);
    }

    if (path === "/api/health") {
      try {
        const countRows = await withSql(env, (sql) => sql`
          SELECT count(*)::int AS entries FROM entries
        `);
        const entries = countRows[0] ? countRows[0].entries : 0;
        return json({ ok: true, database: "up", entries });
      } catch (error) {
        return dbError(error);
      }
    }

    if (path === "/api/index") {
      try {
        return json(await readIndex(env));
      } catch (error) {
        return dbError(error);
      }
    }

    return json({ ok: false, error: "not found" }, 404);
  },
};

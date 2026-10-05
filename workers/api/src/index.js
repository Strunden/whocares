import { buildIndex } from "./index-shape.js";
import { withSql } from "./pg-wire.js";

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

async function readIndex(env) {
  return withSql(env, async (sql) => {
    const metaRows = await sql.simpleQuery(`
      SELECT schema_version,
             to_char(generated, 'YYYY-MM-DD') AS generated,
             title
      FROM atlas_meta
      LIMIT 1
    `);
    const changelog = await sql.simpleQuery(`
      SELECT to_char(entry_date, 'YYYY-MM-DD') AS date, text
      FROM changelog
      ORDER BY position ASC, id ASC
    `);
    const entryRows = await sql.simpleQuery(`
      SELECT document,
             (logo_bytes IS NOT NULL) AS has_logo
      FROM entries
      ORDER BY position ASC, id ASC
    `);
    return buildIndex(
      metaRows[0] || null,
      changelog,
      entryRows.map((row) => row.document),
      entryRows.map((row) => row.has_logo),
    );
  });
}

function safeError(error) {
  return String(error instanceof Error ? error.message : error).replace(
    /postgres(?:ql)?:\/\/\S+/gi,
    "postgresql://redacted",
  );
}

function dbError(error) {
  console.error(
    JSON.stringify({
      message: "database query failed",
      code: error && error.code ? error.code : "unknown",
      error: safeError(error),
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

    if (request.method === "OPTIONS" && (path === "/api/index" || path === "/api/health" || path.startsWith("/api/logo/"))) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET") {
      return json({ ok: false, error: "method not allowed" }, 405);
    }

    if (path === "/api/health") {
      try {
        const countRows = await withSql(
          env,
          (sql) => sql.simpleQuery("SELECT count(*)::int AS entries FROM entries"),
        );
        const entries = countRows[0] ? Number(countRows[0].entries) : 0;
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

    if (path.startsWith("/api/logo/")) {
      const slug = decodeURIComponent(path.slice("/api/logo/".length));
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/.test(slug)) {
        return json({ ok: false, error: "not found" }, 404);
      }
      try {
        const rows = await withSql(env, (sql) => sql.simpleQuery(`
          SELECT encode(logo_bytes, 'base64') AS logo_b64
          FROM entries
          WHERE id = '${slug}'
            AND logo_bytes IS NOT NULL
          LIMIT 1
        `));
        const b64 = rows[0] && rows[0].logo_b64;
        if (!b64) return json({ ok: false, error: "not found" }, 404);
        const raw = atob(b64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
            ...corsHeaders(),
          },
        });
      } catch (error) {
        return dbError(error);
      }
    }

    return json({ ok: false, error: "not found" }, 404);
  },
};

import { attachFunding, funderDetail, funderSummary } from "./funders-shape.js";
import {queryDiscovery} from "./discovery.js";
import {readLogo} from "./logo.js";
import { decodeSlug } from "./path-slug.js";
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
  return withSql(env, async sql => (await queryDiscovery(sql)).catalog);
}

const FUNDER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/;

async function readFunders(env) {
  return withSql(env, async (sql) => {
    const rows = await sql.simpleQuery(`
      SELECT f.id,
             f.name,
             f.kind,
             f.country,
             f.operator,
             f.amount_range,
             f.eligibility_stage,
             f.next_deadline,
             f.dilution,
             (
               SELECT count(DISTINCT l.entry_id)::int
               FROM funding_links l
               JOIN atlas.catalog_read_model e ON e.id = l.entry_id AND e.visible AND e.review_current AND e.review_id IS NOT NULL AND e.decision IN ('retain','correct')
               WHERE l.funder_id = f.id
                 AND l.verified
             ) AS backed
      FROM funders f
      WHERE f.published
      ORDER BY backed DESC, f.name ASC
    `);
    return { funders: rows.map(funderSummary) };
  });
}

async function readFunder(env, id) {
  return withSql(env, async (sql) => {
    const rows = await sql.simpleQuery(`
      SELECT f.id,
             f.name,
             f.kind,
             f.country,
             f.website,
             f.description,
             f.aum_or_programme_size,
             f.care_focus,
             f.operator,
             f.amount_range,
             f.eligibility,
             f.eligibility_stage,
             f.next_deadline,
             f.dilution,
             f.sources::text AS sources
      FROM funders f
      WHERE f.published
        AND f.id = '${id}'
      LIMIT 1
    `);
    if (!rows[0]) return null;
    const links = await sql.simpleQuery(`
      SELECT e.id AS entry_id,
             COALESCE(NULLIF(e.document->>'title', ''), NULLIF(e.document->>'name', ''), e.id) AS entry_name,
             l.relation,
             l.round_label,
             l.amount_eur::text AS amount_eur,
             to_char(l.date, 'YYYY-MM-DD') AS date,
             l.sources::text AS sources
      FROM funding_links l
      JOIN atlas.catalog_read_model e ON e.id = l.entry_id AND e.visible AND e.review_current AND e.review_id IS NOT NULL AND e.decision IN ('retain','correct')
      WHERE l.funder_id = '${id}'
        AND l.verified
      ORDER BY l.date DESC NULLS LAST, entry_name ASC
    `);
    return funderDetail(rows[0], links);
  });
}

function isApiPath(path) {
  return path === "/api/discovery"
    || path === "/api/index"
    || path === "/api/health"
    || path === "/api/funders"
    || path.startsWith("/api/funders/")
    || path.startsWith("/api/logo/");
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

    if (request.method === "OPTIONS" && isApiPath(path)) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET") {
      return json({ ok: false, error: "method not allowed" }, 405);
    }

    if (path === "/api/health") {
      try {
        const countRows = await withSql(
          env,
          (sql) => sql.simpleQuery("SELECT count(*)::int AS entries FROM atlas.catalog_read_model WHERE visible AND review_current AND review_id IS NOT NULL AND decision IN ('retain','correct')"),
        );
        const entries = countRows[0] ? Number(countRows[0].entries) : 0;
        return json({ ok: true, database: "up", entries });
      } catch (error) {
        return dbError(error);
      }
    }

    if (path === "/api/discovery") {
      try { return json(await withSql(env, queryDiscovery)); }
      catch (error) { return dbError(error); }
    }

    if (path === "/api/index") {
      try {
        return json(await readIndex(env));
      } catch (error) {
        return dbError(error);
      }
    }

    if (path === "/api/funders") {
      try {
        return json(await readFunders(env));
      } catch (error) {
        return dbError(error);
      }
    }

    if (path.startsWith("/api/funders/")) {
      const funderId = decodeSlug(path.slice("/api/funders/".length));
      if (funderId === null || !FUNDER_ID.test(funderId) || funderId.includes("/")) {
        return json({ ok: false, error: "not found" }, 404);
      }
      try {
        const funder = await readFunder(env, funderId);
        if (!funder) return json({ ok: false, error: "not found" }, 404);
        return json(funder);
      } catch (error) {
        return dbError(error);
      }
    }

    if (path.startsWith("/api/logo/")) {
      const slug = decodeSlug(path.slice("/api/logo/".length));
      if (slug === null || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/.test(slug)) {
        return json({ ok: false, error: "not found" }, 404);
      }
      try {
        const b64 = await withSql(env, sql => readLogo(sql, slug));
        if (!b64) return json({ ok: false, error: "not found" }, 404);
        const raw = atob(b64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-store",
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

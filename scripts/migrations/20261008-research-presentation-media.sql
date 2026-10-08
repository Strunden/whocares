-- Additive internal-index read layer. Execute inside a batch-tagged transaction.
CREATE TABLE IF NOT EXISTS atlas.object_presentations (
 id text PRIMARY KEY, object_id text NOT NULL REFERENCES atlas.objects(id) ON DELETE RESTRICT,
 locale text NOT NULL DEFAULT 'en', display_title text NOT NULL CHECK(length(trim(display_title)) BETWEEN 1 AND 90),
 orientation_summary text NOT NULL CHECK(length(trim(orientation_summary)) BETWEEN 1 AND 420),
 why_it_matters text, review_state text NOT NULL CHECK(review_state IN ('draft','reviewed','retired')),
 reviewed_by text, reviewed_at timestamptz, review_basis_sha256 text,
 provenance jsonb NOT NULL CHECK(jsonb_typeof(provenance)='object'),
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(object_id,locale),
 CHECK(review_state<>'reviewed' OR (length(trim(reviewed_by))>0 AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND review_basis_sha256 ~ '^[a-f0-9]{64}$' AND review_basis_sha256 IS NOT NULL AND jsonb_typeof(provenance->'dependencies')='array' AND provenance ? 'dependencies'))
);
-- Sourced external media references, distinct from generated illustrations and scientific evidence.
-- URL is the observed asset locator, not a claim that remote bytes are immutable or licensed.
CREATE TABLE IF NOT EXISTS atlas.product_media (
 id text PRIMARY KEY, entry_id text NOT NULL REFERENCES public.entries(id) ON DELETE RESTRICT,
 asset_url text NOT NULL CHECK(asset_url ~ '^https://'), source_url text NOT NULL CHECK(source_url ~ '^https://'),
 source_capture_sha256 text NOT NULL CHECK(source_capture_sha256 ~ '^[a-f0-9]{64}$'),
 media_role text NOT NULL CHECK(media_role IN ('logo','product_image','product_render','screenshot')),
 depiction_status text NOT NULL CHECK(depiction_status IN ('photograph','render','illustrative','unknown')),
 alt_text text NOT NULL CHECK(length(trim(alt_text))>0), caption text NOT NULL, credit text NOT NULL CHECK(length(trim(credit))>0),
 rights_status text NOT NULL CHECK(rights_status IN ('unknown','licensed','permission','public_domain')),
 rights_note text NOT NULL, rights_url text, visibility text NOT NULL DEFAULT 'internal' CHECK(visibility IN ('internal','public')),
 review_state text NOT NULL CHECK(review_state IN ('candidate','reviewed','rejected','retired')),
 reviewed_by text, reviewed_at timestamptz, checked_at timestamptz NOT NULL,
 provenance jsonb NOT NULL CHECK(jsonb_typeof(provenance)='object'),
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(entry_id,asset_url,source_capture_sha256),
 CHECK(review_state<>'reviewed' OR (reviewed_by IS NOT NULL AND length(trim(reviewed_by))>0 AND reviewed_at IS NOT NULL)),
 CHECK(visibility<>'public' OR (rights_status<>'unknown' AND rights_url IS NOT NULL AND rights_url ~ '^https://'))
);
DO $body$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['object_presentations','product_media'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=('atlas.'||t)::regclass AND tgname='audit_write') THEN
   EXECUTE format('CREATE TRIGGER audit_write AFTER INSERT OR UPDATE OR DELETE ON atlas.%I FOR EACH ROW EXECUTE FUNCTION atlas.audit_write()',t);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=('atlas.'||t)::regclass AND tgname='increment_revision') THEN
   EXECUTE format('CREATE TRIGGER increment_revision BEFORE UPDATE ON atlas.%I FOR EACH ROW EXECUTE FUNCTION atlas.increment_revision()',t);
  END IF;
 END LOOP;
END $body$;

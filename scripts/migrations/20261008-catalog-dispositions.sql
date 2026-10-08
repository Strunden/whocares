-- Reversible internal catalog cleanup; originals remain in their owning tables.
-- Execute in a transaction with atlas.batch_id. Decisions are append-only.
CREATE TABLE IF NOT EXISTS atlas.content_reviews (
 id text PRIMARY KEY,
 record_table text NOT NULL CHECK(record_table IN ('entries','objects','evidence','funders','funding_links','enrichment','discovery_inbox','legacy_records')),
 record_id text NOT NULL,
 basis_md5 text NOT NULL CHECK(basis_md5 ~ '^[a-f0-9]{32}$'),
 decision text NOT NULL CHECK(decision IN ('retain','correct','hold','archive','reclassify')),
 entity_class text NOT NULL,
 reason text NOT NULL CHECK(length(trim(reason))>0),
 evidence_refs jsonb NOT NULL CHECK(jsonb_typeof(evidence_refs)='array'),
 replacement_document jsonb,
 reviewed_by text NOT NULL CHECK(length(trim(reviewed_by))>0),
 reviewed_at timestamptz NOT NULL DEFAULT now(),
 batch_id text NOT NULL,
 CHECK((decision='correct' AND replacement_document IS NOT NULL AND jsonb_typeof(replacement_document)='object') OR (decision<>'correct' AND replacement_document IS NULL))
);
CREATE INDEX IF NOT EXISTS content_review_identity ON atlas.content_reviews(record_table,record_id,reviewed_at DESC,id DESC);
CREATE OR REPLACE FUNCTION atlas.reject_content_review_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Content reviews are append-only; append a superseding decision'; END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='atlas.content_reviews'::regclass AND tgname='immutable_review') THEN
  CREATE TRIGGER immutable_review BEFORE UPDATE OR DELETE ON atlas.content_reviews FOR EACH ROW EXECUTE FUNCTION atlas.reject_content_review_mutation();
  CREATE TRIGGER audit_write AFTER INSERT ON atlas.content_reviews FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();
 END IF;
END $$;
CREATE OR REPLACE VIEW atlas.current_content_reviews AS
 SELECT DISTINCT ON(record_table,record_id) * FROM atlas.content_reviews
 ORDER BY record_table,record_id,reviewed_at DESC,id DESC;
-- MD5 is a non-security change detector over Postgres's canonical JSONB rendering.
-- A hold survives source changes until explicitly resolved. A correction cannot
-- fall back to the known-wrong original when its reviewed basis changes.
CREATE OR REPLACE VIEW atlas.catalog_read_model AS
 SELECT e.id,e.published,md5((to_jsonb(e)-'logo_bytes')::text) AS basis_md5,
 r.id AS review_id,r.decision,r.entity_class,r.reason,
 CASE WHEN r.decision='correct' THEN r.replacement_document ELSE e.document || jsonb_build_object('id',e.id,'type',e.type,'published',e.published) END AS document,
 (r.basis_md5=md5((to_jsonb(e)-'logo_bytes')::text)) AS review_current,
 (e.published AND e.type='company' AND e.id NOT LIKE 'funding-rule-%'
  AND (r.decision IS NULL OR r.decision='retain' OR
       (r.decision='correct' AND r.basis_md5=md5((to_jsonb(e)-'logo_bytes')::text)))) AS visible
 FROM public.entries e LEFT JOIN atlas.current_content_reviews r
 ON r.record_table='entries' AND r.record_id=e.id;
-- A verified quotation flag is only a text-match check, never semantic validation.
CREATE OR REPLACE VIEW atlas.catalog_matched_passages AS
 SELECT ev.* FROM public.evidence ev JOIN atlas.catalog_read_model c ON c.id=ev.entry_id
 WHERE c.visible AND ev.quote_verified AND ev.http_status=200;

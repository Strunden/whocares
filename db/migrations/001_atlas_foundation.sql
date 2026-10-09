BEGIN;

CREATE SCHEMA atlas;

CREATE TABLE atlas.write_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, recorded_at timestamptz NOT NULL DEFAULT now(),
 actor text NOT NULL DEFAULT current_user, batch_id text NOT NULL, relation text NOT NULL,
 operation text NOT NULL, record_key text, before_row jsonb, after_row jsonb,
 transaction_id bigint NOT NULL DEFAULT txid_current());

CREATE FUNCTION atlas.audit_write() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO atlas.write_log(batch_id,relation,operation,record_key,before_row,after_row)
 VALUES (COALESCE(NULLIF(current_setting('atlas.batch_id',true),''),'unspecified'),TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME,TG_OP,
 COALESCE(to_jsonb(NEW)->>'id',to_jsonb(OLD)->>'id',to_jsonb(NEW)->>'key'),
 CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END, CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END);
 RETURN COALESCE(NEW,OLD);
END $$;

SELECT set_config('atlas.batch_id','atlas-foundation-20261008',true);

CREATE TABLE atlas.migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now(), description text NOT NULL, manifest jsonb NOT NULL);

CREATE TABLE atlas.principles_versions (
 key text NOT NULL, version integer NOT NULL CHECK(version>0), body jsonb NOT NULL,
 canonical_sha256 text NOT NULL CHECK(canonical_sha256 ~ '^[0-9a-f]{64}$'),
 provenance jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(key,version),
 CHECK(jsonb_typeof(body)='object'),CHECK(jsonb_typeof(provenance)='object'));

CREATE FUNCTION atlas.prevent_rewrite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Append-only relation: add a new version or migration'; END $$;

CREATE TRIGGER immutable_principles BEFORE UPDATE OR DELETE ON atlas.principles_versions FOR EACH ROW EXECUTE FUNCTION atlas.prevent_rewrite();

CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE ON atlas.write_log FOR EACH ROW EXECUTE FUNCTION atlas.prevent_rewrite();

CREATE VIEW atlas.current_principles AS SELECT DISTINCT ON(key) key,version,body,canonical_sha256,provenance,created_at FROM atlas.principles_versions ORDER BY key,version DESC;

CREATE TABLE atlas.sources (
 id text PRIMARY KEY, title text NOT NULL, locator text NOT NULL, publisher text,
 source_kind text NOT NULL CHECK(source_kind IN ('primary_research','institutional','provider_claim','field_observation','historical_record','product_direction')),
 published_date date, accessed_date date, scope text NOT NULL, limitations text NOT NULL,
 provenance jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE atlas.objects (
 id text PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('aspiration','stakeholder','problem_space','problem','daily_situation','lived_workaround','systemic_cause','institutional_response','solution','open_question')),
 title text NOT NULL, statement text NOT NULL, scope jsonb NOT NULL,
 epistemic_status text NOT NULL CHECK(epistemic_status IN ('documented','interpretation','candidate','hypothesis','illustrative','open_question','normative','reference')),
 confidence jsonb NOT NULL DEFAULT '{"basis":"not_assessed","rationale":"Research not reviewed"}',
 provenance jsonb NOT NULL, revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 entry_id text REFERENCES public.entries(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (jsonb_typeof(scope)='object'), CHECK(jsonb_typeof(provenance)='object'),
 CHECK(confidence->>'basis' IN ('not_assessed','single_source','corroborated','contested','not_applicable') AND confidence ? 'rationale'),
 CHECK(NOT confidence ?| ARRAY['score','opportunity_score','attractiveness']),
 CHECK(entry_id IS NULL OR kind='solution'));

CREATE TABLE atlas.relationships (
 id text PRIMARY KEY, from_id text NOT NULL REFERENCES atlas.objects(id) ON DELETE RESTRICT,
 to_id text NOT NULL REFERENCES atlas.objects(id) ON DELETE RESTRICT,
 relation text NOT NULL CHECK(relation IN ('part_of','affects','aspires_to','arises_in','works_around','contributes_to','responds_to','addresses','raises_question','context_for','tension_with')),
 statement text NOT NULL, epistemic_status text NOT NULL CHECK(epistemic_status IN ('documented','interpretation','candidate','hypothesis','illustrative','normative','reference')),
 confidence jsonb NOT NULL, provenance jsonb NOT NULL, revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(from_id<>to_id), CHECK(confidence->>'basis' IN ('not_assessed','single_source','corroborated','contested','not_applicable') AND confidence ? 'rationale'),
 CHECK(NOT confidence ?| ARRAY['score','opportunity_score','attractiveness']), UNIQUE(from_id,to_id,relation));

CREATE TABLE atlas.evidence_links (
 id text PRIMARY KEY, object_id text REFERENCES atlas.objects(id) ON DELETE RESTRICT,
 relationship_id text REFERENCES atlas.relationships(id) ON DELETE RESTRICT,
 source_id text NOT NULL REFERENCES atlas.sources(id) ON DELETE RESTRICT,
 stance text NOT NULL CHECK(stance IN ('supports','contradicts','context','origin')),
 locator text NOT NULL, excerpt text, note text NOT NULL, reviewed_at timestamptz,
 provenance jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((object_id IS NOT NULL)::int+(relationship_id IS NOT NULL)::int=1));

CREATE TABLE atlas.legacy_records (
 id text PRIMARY KEY, entry_id text NOT NULL UNIQUE REFERENCES public.entries(id) ON DELETE RESTRICT,
 original_document jsonb NOT NULL, original_row jsonb NOT NULL,
 review_state text NOT NULL DEFAULT 'unreviewed' CHECK(review_state IN ('unreviewed','reviewed','mapped')),
 note text NOT NULL, imported_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE atlas.import_batches (
 id text PRIMARY KEY, title text NOT NULL, state text NOT NULL CHECK(state IN ('pending_artifact','staged','reviewed')),
 expected_counts jsonb NOT NULL, actual_counts jsonb NOT NULL, provenance jsonb NOT NULL,
 note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());

CREATE FUNCTION atlas.validate_documented() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM atlas.objects o WHERE o.epistemic_status='documented' AND NOT EXISTS
 (SELECT 1 FROM atlas.evidence_links e WHERE e.object_id=o.id AND e.stance='supports' AND e.reviewed_at IS NOT NULL))
 OR EXISTS (SELECT 1 FROM atlas.relationships r WHERE r.epistemic_status='documented' AND NOT EXISTS
 (SELECT 1 FROM atlas.evidence_links e WHERE e.relationship_id=r.id AND e.stance='supports' AND e.reviewed_at IS NOT NULL))
 THEN RAISE EXCEPTION 'Documented assertions require a reviewed, supporting evidence link'; END IF;
 RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER documented_evidence AFTER INSERT OR UPDATE OR DELETE ON atlas.objects DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas.validate_documented();

CREATE CONSTRAINT TRIGGER documented_evidence AFTER INSERT OR UPDATE OR DELETE ON atlas.relationships DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas.validate_documented();

CREATE CONSTRAINT TRIGGER documented_evidence AFTER INSERT OR UPDATE OR DELETE ON atlas.evidence_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas.validate_documented();

CREATE FUNCTION atlas.increment_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.revision=OLD.revision+1; NEW.updated_at=now(); RETURN NEW; END $$;

CREATE TRIGGER revision BEFORE UPDATE ON atlas.objects FOR EACH ROW EXECUTE FUNCTION atlas.increment_revision();

CREATE TRIGGER revision BEFORE UPDATE ON atlas.relationships FOR EACH ROW EXECUTE FUNCTION atlas.increment_revision();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.migrations FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.principles_versions FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.sources FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.objects FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.relationships FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.evidence_links FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.legacy_records FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE TRIGGER audit AFTER INSERT OR UPDATE OR DELETE ON atlas.import_batches FOR EACH ROW EXECUTE FUNCTION atlas.audit_write();

CREATE INDEX ON atlas.objects(kind);

CREATE INDEX ON atlas.relationships(from_id);

CREATE INDEX ON atlas.relationships(to_id);

CREATE INDEX ON atlas.evidence_links(object_id);

CREATE INDEX ON atlas.evidence_links(relationship_id);

CREATE INDEX ON atlas.evidence_links(source_id);

INSERT INTO atlas.migrations VALUES ('001_atlas_foundation',now(),'Add isolated problem atlas, versioned principles, evidence and write audit','{"existing_tables_modified":[],"backup_branch":"br-raspy-morning-b2xwxgu7","test_branch":"br-empty-star-b2hpk36u","source_git_commit":"6bb1c22","schema":"atlas","ddl":"db/migrations/001_atlas_foundation.sql"}'::jsonb);

INSERT INTO atlas.principles_versions(key,version,body,canonical_sha256,provenance) VALUES ('who-cares-product',1,'{"key":"who-cares-product","version":1,"effective_date":"2026-10-08","authority":"User-approved product direction; not empirical research evidence","provenance":{"conversation_id":"6ac6aa26-312c-83eb-b973-f82acbe0770d","request":"Realign Who Cares knowledge model","date":"2026-10-08"},"principles":[{"id":"purpose","text":"Evidence-backed problem discovery and market intelligence for venture builders. Discovery leads to causal understanding and self-directed hypothesis formation."},{"id":"ethical-north-star","text":"A Life Worth Living guides consideration of ALL affected stakeholders: older adults, professional and family caregivers, providers, payers, communities and financially sustainable innovators. It is not a mandatory navigation taxonomy."},{"id":"problem-first","text":"Research the problem landscape independently of existing companies and company themes. Companies and solutions are evidence of responses, not the origin of the taxonomy. An existing response does not establish effectiveness or remove a problem."},{"id":"problem-space","text":"A problem space is a bounded, revisable grouping of related human, operational or systemic frictions that impede valued outcomes. Define affected stakeholders, situations, scope, connected problems, proposed mechanisms, responses and evidence gaps. It is not merely a diagnosis, industry label, company cluster or market size. Overlaps are allowed; boundaries are editorial interpretations with provenance."},{"id":"bottom-up","text":"Represent aspirations, daily situations and lived workarounds with their speakers, settings, dates and limits. Do not invent interviews or universal aspirations. Illustrative narratives must remain visibly illustrative."},{"id":"top-down","text":"Represent systems, incentives, reimbursement, care provision and institutional responses distinctly, and connect them to lived experience through sourced relationships. Distinguish documented mechanisms from causal hypotheses."},{"id":"one-graph","text":"All persona lenses operate on one knowledge graph with stable identities and explicit relationships. Lenses highlight stakeholder aspirations, experiences and constraints; they do not create disconnected maps or taxonomies."},{"id":"semantic-zoom","text":"A map-centric continuous semantic zoom first builds a quick horizontal mental model, then enables vertical documentary-story deep dives into situations, mechanisms, stakeholders, research and responses. Each scale should teach something new and preserve orientation."},{"id":"visual-direction","text":"Use soft translucent organic territories, generous space and sparse chrome. Preserve an accessible search/list route and clear evidence reading. Territory size, color and position must not rank venture potential."},{"id":"research-integrity","text":"Keep documented claims, interpretation, research candidates, hypotheses, illustrative scenes and unknowns distinct. Each claim and relationship carries provenance, scoped evidence and qualitative research confidence with a rationale. A citation alone does not verify a candidate."},{"id":"no-ai-selection","text":"No opportunity scores, attractiveness rankings or AI venture judgments. Users form their own hypotheses. Historical killed/standing statuses remain historical analyst decisions and must not become problem validity or opportunity labels."},{"id":"provenance-and-change","text":"Preserve existing company and user records. Version principles append-only; track graph revisions, sources, research gaps and every write. Import earlier 48 domains, 384 candidate problems and 50 sources only from accessible original artifacts; keep candidates unverified until claim-level evidence is reviewed."}],"alignment_checks":["Define the problem space without referencing company clusters.","Show how bottom-up situations and top-down mechanisms connect with appropriate evidence status.","Show what horizontal overview and vertical zoom teach.","Demonstrate all lenses share graph identities.","Show sources, limits and open questions without opportunity judgments."]}'::jsonb,'1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2','{"conversation_id":"6ac6aa26-312c-83eb-b973-f82acbe0770d","request":"Realign Who Cares knowledge model","date":"2026-10-08"}'::jsonb);

COMMIT;

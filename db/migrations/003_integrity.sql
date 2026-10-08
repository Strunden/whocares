BEGIN;

SELECT set_config('atlas.batch_id','atlas-integrity-20261008',true);

SET CONSTRAINTS ALL IMMEDIATE;

ALTER TABLE atlas.objects ADD CONSTRAINT confidence_shape CHECK (
 jsonb_typeof(confidence)='object' AND confidence ?& ARRAY['basis','rationale']
 AND jsonb_typeof(confidence->'rationale')='string' AND length(confidence->>'rationale')>0);

ALTER TABLE atlas.relationships ADD CONSTRAINT confidence_shape CHECK (
 jsonb_typeof(confidence)='object' AND confidence ?& ARRAY['basis','rationale']
 AND jsonb_typeof(confidence->'rationale')='string' AND length(confidence->>'rationale')>0);

CREATE OR REPLACE FUNCTION atlas.validate_documented() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM atlas.objects o WHERE o.epistemic_status='documented' AND NOT EXISTS
 (SELECT 1 FROM atlas.evidence_links e JOIN atlas.sources s ON s.id=e.source_id
 WHERE e.object_id=o.id AND e.stance='supports' AND e.reviewed_at IS NOT NULL
 AND s.source_kind NOT IN ('product_direction','historical_record')))
 OR EXISTS (SELECT 1 FROM atlas.relationships r WHERE r.epistemic_status='documented' AND NOT EXISTS
 (SELECT 1 FROM atlas.evidence_links e JOIN atlas.sources s ON s.id=e.source_id
 WHERE e.relationship_id=r.id AND e.stance='supports' AND e.reviewed_at IS NOT NULL
 AND s.source_kind NOT IN ('product_direction','historical_record')))
 THEN RAISE EXCEPTION 'Documented assertions require reviewed empirical or provider evidence, not product direction or legacy decisions'; END IF;
 RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER documented_evidence AFTER UPDATE OR DELETE ON atlas.sources DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas.validate_documented();

CREATE FUNCTION atlas.validate_relationship_kinds() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM atlas.relationships r JOIN atlas.objects a ON a.id=r.from_id JOIN atlas.objects b ON b.id=r.to_id
 WHERE CASE r.relation
 WHEN 'part_of' THEN NOT (a.kind IN ('problem','problem_space') AND b.kind='problem_space')
 WHEN 'affects' THEN NOT (a.kind IN ('problem','systemic_cause') AND b.kind='stakeholder')
 WHEN 'aspires_to' THEN NOT (a.kind='stakeholder' AND b.kind='aspiration')
 WHEN 'arises_in' THEN NOT (a.kind='problem' AND b.kind='daily_situation')
 WHEN 'works_around' THEN NOT (a.kind='lived_workaround' AND b.kind='problem')
 WHEN 'contributes_to' THEN NOT (a.kind='systemic_cause' AND b.kind IN ('problem','systemic_cause'))
 WHEN 'responds_to' THEN NOT (a.kind IN ('solution','institutional_response') AND b.kind='problem')
 WHEN 'addresses' THEN NOT (a.kind IN ('solution','institutional_response') AND b.kind='problem')
 WHEN 'raises_question' THEN b.kind<>'open_question'
 ELSE false END)
 THEN RAISE EXCEPTION 'Relationship endpoints do not match the atlas object kinds'; END IF;
 RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER relationship_kinds AFTER INSERT OR UPDATE ON atlas.objects DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas.validate_relationship_kinds();

CREATE CONSTRAINT TRIGGER relationship_kinds AFTER INSERT OR UPDATE ON atlas.relationships DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas.validate_relationship_kinds();

SET CONSTRAINTS ALL DEFERRED;

INSERT INTO atlas.migrations(id,description,manifest) VALUES ('003_integrity','Require complete confidence rationale and semantic endpoints; product direction cannot verify empirical claims','{"existing_tables_modified":[]}'::jsonb);

COMMIT;

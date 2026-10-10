-- Apply through the audited test-before-live executor; do not disable validation triggers.
CREATE OR REPLACE FUNCTION atlas.validate_relationship_kinds()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
 IF EXISTS(SELECT 1 FROM atlas.relationships r JOIN atlas.objects a ON a.id=r.from_id JOIN atlas.objects b ON b.id=r.to_id
 WHERE CASE r.relation
 WHEN 'part_of' THEN NOT (a.kind IN ('problem','problem_space') AND b.kind='problem_space')
 WHEN 'affects' THEN NOT (a.kind IN ('problem','systemic_cause') AND b.kind='stakeholder')
 WHEN 'aspires_to' THEN NOT (a.kind='stakeholder' AND b.kind='aspiration')
 WHEN 'arises_in' THEN NOT (a.kind='problem' AND b.kind='daily_situation')
 WHEN 'works_around' THEN NOT (a.kind='lived_workaround' AND b.kind='problem')
 WHEN 'contributes_to' THEN NOT (a.kind='systemic_cause' AND b.kind IN ('problem','systemic_cause'))
 WHEN 'responds_to' THEN NOT (a.kind IN ('solution','institutional_response') AND (b.kind='problem' OR (b.kind='daily_situation' AND COALESCE(r.provenance->'navigation'='true'::jsonb,false))))
 WHEN 'addresses' THEN NOT (a.kind IN ('solution','institutional_response') AND b.kind='problem')
 WHEN 'raises_question' THEN b.kind<>'open_question'
 ELSE false END)
 THEN RAISE EXCEPTION 'Relationship endpoints do not match the atlas object kinds'; END IF;
 RETURN NULL;
END $function$

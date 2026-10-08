DO $$
DECLARE before_count bigint; rev integer;
BEGIN
 SELECT count(*) INTO before_count FROM atlas.write_log;
 -- All successful test writes also live inside rolled-back subtransactions.
 BEGIN
  INSERT INTO atlas.objects(id,kind,title,statement,scope,epistemic_status,confidence,provenance)
  VALUES ('test-unbacked','problem','Test','Unbacked','{}','documented','{"basis":"single_source","rationale":"Test"}','{}');
  SET CONSTRAINTS ALL IMMEDIATE;
  RAISE EXCEPTION 'Unbacked documented assertion was accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 BEGIN
  INSERT INTO atlas.objects(id,kind,title,statement,scope,epistemic_status,confidence,provenance)
  VALUES ('test-incomplete-confidence','problem','Test','Test','{}','candidate','{}','{}');
  RAISE EXCEPTION 'Incomplete confidence was accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO atlas.objects(id,kind,title,statement,scope,epistemic_status,confidence,provenance)
  VALUES ('test-score','problem','Test','Test','{}','candidate','{"basis":"not_assessed","rationale":"Test","opportunity_score":99}','{}');
  RAISE EXCEPTION 'Opportunity score was accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  UPDATE atlas.principles_versions SET body='{}';
  RAISE EXCEPTION 'Principle rewrite was accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 BEGIN
  DELETE FROM atlas.write_log;
  RAISE EXCEPTION 'Audit removal was accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 BEGIN
  INSERT INTO atlas.relationships(id,from_id,to_id,relation,statement,epistemic_status,confidence,provenance)
  VALUES ('test-dangling','absent','space-everyday-participation','part_of','Test','candidate','{"basis":"not_assessed","rationale":"Test"}','{}');
  RAISE EXCEPTION 'Dangling reference was accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN
  INSERT INTO atlas.relationships(id,from_id,to_id,relation,statement,epistemic_status,confidence,provenance)
  VALUES ('test-endpoints','stakeholder-older-adults','space-everyday-participation','responds_to','Test','candidate','{"basis":"not_assessed","rationale":"Test"}','{}');
  SET CONSTRAINTS ALL IMMEDIATE;
  RAISE EXCEPTION 'Invalid response endpoints were accepted' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 BEGIN
  INSERT INTO atlas.objects(id,kind,title,statement,scope,epistemic_status,confidence,provenance)
  VALUES ('test-policy-as-fact','problem','Test','Test','{}','documented','{"basis":"single_source","rationale":"Test"}','{}');
  INSERT INTO atlas.evidence_links(id,object_id,source_id,stance,locator,note,reviewed_at,provenance)
  VALUES ('test-policy-source','test-policy-as-fact','source-user-product-direction','supports','Test','Test',now(),'{}');
  SET CONSTRAINTS ALL IMMEDIATE;
  RAISE EXCEPTION 'Product direction verified an empirical claim' USING ERRCODE='ZX001';
 EXCEPTION WHEN raise_exception THEN NULL; END;
 BEGIN
  UPDATE atlas.objects SET title=title WHERE id='problem-environmental-barriers';
  SELECT revision INTO rev FROM atlas.objects WHERE id='problem-environmental-barriers';
  IF rev<>2 OR (SELECT count(*) FROM atlas.write_log)<>before_count+1 THEN
    RAISE EXCEPTION 'Revision or audit tracking failed' USING ERRCODE='ZX001';
  END IF;
  RAISE EXCEPTION 'Rollback successful test write' USING ERRCODE='ZX002';
 EXCEPTION WHEN SQLSTATE 'ZX002' THEN NULL; END;
 IF (SELECT count(*) FROM atlas.write_log)<>before_count THEN
   RAISE EXCEPTION 'Tests left permanent writes';
 END IF;
END $$

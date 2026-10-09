BEGIN;
SELECT set_config('atlas.batch_id','needs-copy-20261009',true);
UPDATE atlas.objects SET scope=jsonb_set(scope,'{cost,note}','"Price not verified."'::jsonb) WHERE id='solution-aok-pflegenavigator' AND scope->'cost'->>'note'='No consumer price captured; do not label free solely from access to the page.';
UPDATE atlas.objects SET scope=jsonb_set(scope,'{limitations,1}','"Eligibility differs between SGB II and SGB XII applicants; individual advice is needed."'::jsonb) WHERE id='solution-berlin-mietschuldenhilfe' AND scope->'limitations'->>1 LIKE 'Do not apply%';
UPDATE atlas.objects SET scope=jsonb_set(scope,'{limitations,0}','"Training and implementation support; workload and resident outcomes require local evaluation."'::jsonb) WHERE id='solution-einstep-implementation-support' AND scope->'limitations'->>0 LIKE 'This entry%';
UPDATE atlas.relationships SET statement=replace(statement,'This entry is the named support programme, not a generic ''better documentation'' response class.','Training and implementation support; workload and resident outcomes require local evaluation.') WHERE from_id='solution-einstep-implementation-support' AND statement LIKE '%This entry%';
COMMIT;

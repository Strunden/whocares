BEGIN;
SELECT set_config('atlas.batch_id','navigation-short-titles-20261009',true);
WITH labels(id, short_title) AS (VALUES
 ('study-aspiration-care-home','Care home'),
 ('study-aspiration-company','Companionship'),
 ('study-aspiration-rent','Affording rent'),
 ('study-aspiration-stay-home','Staying at home'),
 ('study-aspiration-wc-object-a11e36230c1d42a53fbca57d','A break from caring'),
 ('study-aspiration-wc-object-c1eb9499ddc4bba8175d4208','Time to care'),
 ('review-problem-break-away','Time away'),
 ('review-problem-break-hours','A few hours off'),
 ('review-problem-care-cover','Covering a shift'),
 ('review-problem-care-documentation','Care records'),
 ('review-problem-care-handover','Handover'),
 ('review-problem-care-home-urgent','Leaving hospital'),
 ('review-problem-company-out','Getting out to see people'),
 ('review-problem-company-talk','Everyday conversation'),
 ('review-problem-home-access','Moving around at home'),
 ('review-problem-home-help','Reaching help when alone'),
 ('review-problem-home-shopping','Managing the shopping'),
 ('review-problem-rent-affordable-home','Finding an affordable home'),
 ('review-problem-rent-arrears','Behind on rent'),
 ('study-problem-care-choice','Different wishes'),
 ('study-problem-care-fit','Finding the right fit'),
 ('study-problem-care-routines','Personal routines'),
 ('study-problem-conversation-time','Time for conversation'),
 ('study-problem-housing-cost','Covering everyday costs'),
 ('study-problem-housing-support','Finding financial help'),
 ('review-response-silbernetz','Silbernetz'),
 ('solution-aai-supported-holidays','AAI supported holidays'),
 ('solution-alzheimer-hamburg-home-visits','Alzheimer Hamburg visits'),
 ('solution-berlin-mietschuldenhilfe','Berlin rent-arrears help'),
 ('solution-berlin-wbs','Berlin WBS'),
 ('solution-caritas-berlin-sozialberatung','Caritas Berlin advice'),
 ('solution-drk-leer-transport','DRK Leer transport'),
 ('solution-drk-stuttgart-wohnberatung','DRK Stuttgart home advice'),
 ('solution-einstep-implementation-support','EinSTEP support'),
 ('solution-johanniter-short-stay','Johanniter short stays'),
 ('solution-johanniter-stift-berlin-lichterfelde','Johanniter-Stift Lichterfelde'),
 ('solution-malteser-besuchsdienst','Malteser visits'),
 ('solution-malteser-mobile-einkaufshilfe','Malteser shopping trips'),
 ('solution-voize-altenpflege','voize elder care'),
 ('wc-object-0fa22338740ba4f0e4c9d81f','AVACANO care-place search'),
 ('wc-object-1f8621db6526f94ba2ba4c89','Pforzheim neighbourhood help'),
 ('wc-object-2d070343f2e5e41b3cf2092e','Puderbach transport'),
 ('wc-object-919ce94c44fc5a075587e852','Harzklinikum discharge help')
), desired AS (
 SELECT o.id, COALESCE(l.short_title,o.scope->'navigation'->>'title') AS short_title
 FROM atlas.objects o LEFT JOIN labels l ON l.id=o.id
 WHERE o.scope->'navigation'->>'role' IN ('need','situation','solution')
)
UPDATE atlas.objects o
SET scope=jsonb_set(o.scope,'{navigation,short_title}',to_jsonb(d.short_title))
FROM desired d
WHERE o.id=d.id AND o.scope->'navigation'->>'short_title' IS DISTINCT FROM d.short_title;
COMMIT;

-- Preserve company media while allowing specific graph offerings to own their imagery.
BEGIN;
SELECT set_config('atlas.batch_id','offering-media-20261009',true);
ALTER TABLE atlas.product_media ADD COLUMN IF NOT EXISTS object_id text REFERENCES atlas.objects(id) ON DELETE RESTRICT;
ALTER TABLE atlas.product_media ALTER COLUMN entry_id DROP NOT NULL;
DO $body$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='atlas.product_media'::regclass AND conname='product_media_one_owner') THEN
  ALTER TABLE atlas.product_media ADD CONSTRAINT product_media_one_owner CHECK ((entry_id IS NOT NULL)::int+(object_id IS NOT NULL)::int=1);
 END IF;
END $body$;
CREATE UNIQUE INDEX IF NOT EXISTS product_media_object_asset ON atlas.product_media(object_id,asset_url,source_capture_sha256) WHERE object_id IS NOT NULL;
COMMIT;

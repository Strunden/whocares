# Local illustration API

Base URL: `http://127.0.0.1:8788`. JSON routes use `Content-Type: application/json`. Paid generation, saved images, status and configuration require `Authorization: Bearer <local studio token>`. The token is in `.local/studio-token`; use the caller script to avoid handling it manually. Never use the OpenRouter key as the studio token.

## Routes

| Route | Authorization | Purpose |
| --- | --- | --- |
| `GET /` | local Host/Origin checks | Local studio; preloads its studio token |
| `GET /health` | local Host/Origin checks | Key configured flag, default model, prompt and reference versions |
| `GET /v1/style` | local Host/Origin checks | Fixed style, composition names and reference URLs |
| `GET /references/:id.jpg` | local Host/Origin checks | One of worker, adult, conversation, object, kitchen |
| `GET /v1/status` | bearer | Active/queued counts, concurrency limit and individual job progress |
| `POST /v1/prompt` | bearer | Compile a scene without a paid generation |
| `POST /v1/jobs` | bearer | Accept a scene for queued generation; returns 202 with job ID |
| `GET /v1/jobs/:id` | bearer | Per-image state, phase, queue position and result ID |
| `POST /v1/images/generations` | bearer | Synchronous compatibility route; shares the same queue |
| `GET /v1/images?cursor=...` | bearer | Saved metadata, at most 100 records; follow returned cursor |
| `GET /v1/images/:id` | bearer | One saved metadata record |
| `GET /v1/images/:id/image` | bearer | Image bytes; use returned MIME type |
| `POST /v1/config/openrouter` | bearer | Local password-form setup; body has key only, response never contains it |

## Scene request

```json
{
  "scene": "An older adult watering three small herb pots on a balcony, a quiet independent everyday moment.",
  "template": "interaction"
}
```

`scene` is required, 10–1500 characters. `template` is portrait, interaction, object or environment; default interaction. All other fields are rejected. Request body limit is 8 KB. The model, references, style and rendering settings belong to the service.

The recommended job route returns HTTP 202 with `{ "id": "UUID", "status_url": "/v1/jobs/UUID" }`. Poll that protected URL. A job moves from queued to running (preparing/drawing/reviewing), then completed or failed. Completed jobs have result_id; fetch `/v1/images/:result_id` for metadata and the protected image URL. Jobs use the same ID as their saved result, enabling recovery.

The synchronous compatibility route waits through the queue and returns HTTP 201 with a saved metadata record. Its useful fields include `id`, `created_at`, `scene`, `template`, `model`, `provider_endpoint`, `style_version`, `prompt_version`, `reference_ids`, `prompt`, `settings`, `usage`, `mime`, `image_url`, `review`, and `duration_ms`. Keep that record with the image. `image_url` is a protected relative URL: retrieve it with the studio token. The helper saves a PNG, JPEG or WebP extension according to its MIME type, not an assumed format.

Review status can be machine_pass, style_notes, content_check or review_unavailable. Old saved results may say needs_revision; the studio treats old aesthetic-only findings as optional notes. `publication_status` remains pending_human_review. Scores are advisory; no automatic publishing or style retuning occurs.

## Failure and recovery

| Status | Meaning | Action |
| --- | --- | --- |
| 400 | Invalid scene/schema, malformed or oversized JSON | Fix the request; do not send style/model fields |
| 401 | Missing/wrong studio token | Use the caller helper or the local studio |
| 403 | Cross-origin or wrong Host | Call the loopback endpoint from the same local context |
| 404 | Unknown route/result/reference | Check the ID/path; verify reference preparation |
| 415 | Wrong content type | Send application/json |
| 429 | Queue capacity or session limit reached | Check status; let queued work finish, or restart an idle service for a new session |
| 503 | Provider key missing | Save it in the local studio setup field |
| 502 | Discovery/provider/image-processing/storage failure | Inspect logs and saved results before retrying |

Queue waiting adds time to generation. The async caller waits up to 25 minutes while polling short-lived job requests; the synchronous compatibility request may exceed its 350-second client timeout when queued. Prefer the job API for batches. upstream image generation allows 240 seconds and review 90 seconds. Generation and review are separate: if review fails, the paid candidate is still saved and returned as review_unavailable.

The service never automatically retries a paid request. On a timeout, check the studio's saved results first: the request can finish on the server after the caller loses its connection. Use `--existing RESULT_ID OUTPUT_PREFIX` to recover saved artwork without paying for another generation. Job state and waiting tasks are in memory and reset on service restart. Completed image/metadata files persist, so recover using the job ID if polling returns 404 after a restart. There is no idempotency-key or durable queue; do not submit repeated requests while waiting.

## Operating the service

Start from `workers/illustrations` with `npm run dev`. The default port is 8788. Set PORT before starting to change it, and set WHOCARES_ILLUSTRATION_URL for the caller accordingly. The service binds only to 127.0.0.1 and rejects external Host/Origin values.

The local key file survives restarts and is re-read automatically. The setup route validates key shape, not credit balance; successful live generation is the connection test. The local token also persists across restarts. Reference originals are tracked; prepared JPEGs are ignored build outputs; generated runtime images and tokens are under ignored `.local/`.

Default limits: three active generations, a FIFO queue with capacity 12, and 12 generation attempts per process session. Multiple agents may submit independent jobs concurrently; they need not wait for the service to become idle. Discovery or generation failures after validation can consume an attempt. Configure an OpenRouter key credit limit if a hard dollar budget is required. Never expose this service publicly without replacing local setup/token handling with appropriate hosted authentication, quotas, jobs and storage.

## Changing the approved recipe

The user approved the tested second-round sparse-wash-v2 prompt. Its exact text is in src/style.js and second-round result metadata. Reference library version is sketch-color-v1. Keep these separate so prompt changes do not imply changed image references.

An intentional change should have a new prompt version, preserved prior results and a small representative benchmark. Keep the same scene requests when comparing style changes; document any necessary content clarification separately. Do not tune based solely on reviewer scores. Model aliases and provider behavior may change, so rerun representative tests after a model/provider change.

## Durable analysis

- `GET /v1/history` (bearer auth): `{ attempts: [...] }`, including successful, failed, interrupted and rejected accepted attempts. Contains scene/prompt and provider call statistics; treat as private application data.
- `GET /v1/stats` (bearer auth): counts by state, `known_cost_usd`, `calls_with_cost`, `calls_without_cost`, and a cost limitation note. Counts exclude free capability discovery calls from missing-cost totals.
- `GET /v1/jobs/:id` falls back to the persistent attempt when no live queue entry exists. On restart, unfinished attempts become `interrupted`. Check `image_saved` and the image route before considering another paid request.

History includes pre-existing successful results imported at startup with `historical_import: true`; their unavailable timings/errors are not fabricated. Active queue status remains an in-memory view. All provider/error/lifecycle events remain on disk under `.local/events/` without a retention limit.

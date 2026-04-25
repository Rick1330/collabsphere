# Cloudflare R2

This directory holds the intended S3-compatible object-storage contract for CollabSphere.

Current direction:

- use one R2 bucket per deploy environment
- keep application storage portable through the existing S3-compatible runtime contract
- prefer presigned URLs over public-write access
- apply an explicit CORS policy for browser uploads and downloads
- use custom domains only when we have a concrete serving need

## Why R2 fits here

- the runtime already accepts standard S3 credentials and an optional `S3_ENDPOINT`
- Cloudflare R2 exposes an S3-compatible endpoint, so the app contract stays portable
- staging and production can use separate buckets without changing application code

## Expected environments

- `staging`
  - bucket name such as `collabsphere-staging`
  - origin allowlist should include the staging web origin and local development origin when needed
- `production`
  - bucket name such as `collabsphere-production`
  - origin allowlist should be production-only unless there is a deliberate cross-origin use case

## Bootstrap boundary

`pnpm bootstrap:r2 -- --environment staging|production` is intended to:

- verify or create the target bucket
- apply the configured bucket CORS rules
- optionally attach a custom domain

For local operator use, the preferred auth path is interactive Wrangler OAuth via `pnpm dlx wrangler login`.

For headless automation, the bootstrap script can also use:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

It does not create the application's runtime S3 access key pair. Treat that as a separate credential-provisioning step and store the resulting access key ID and secret in the target secret manager.

## Runtime contract

For Cloudflare R2, application runtime values should look like:

- `S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`
- `S3_BUCKET=<environment bucket>`
- `S3_REGION=auto`
- `S3_ACCESS_KEY_ID=<r2 access key>`
- `S3_SECRET_ACCESS_KEY=<r2 secret key>`

If jurisdictional buckets are introduced later, the endpoint must switch to the jurisdiction-specific host and the client should not assume a single global endpoint.

## Control-plane env vars

The bootstrap script can use either:

- local Wrangler OAuth auth from `pnpm dlx wrangler login`
- or API auth with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`

If using API auth, set:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

And then either environment-specific or shared names:

- `CLOUDFLARE_R2_STAGING_BUCKET_NAME` / `CLOUDFLARE_R2_PRODUCTION_BUCKET_NAME`
- `CLOUDFLARE_R2_STAGING_ALLOWED_ORIGINS` / `CLOUDFLARE_R2_PRODUCTION_ALLOWED_ORIGINS`
- `CLOUDFLARE_R2_STAGING_CUSTOM_DOMAIN` / `CLOUDFLARE_R2_PRODUCTION_CUSTOM_DOMAIN` (optional)
- `CLOUDFLARE_R2_STAGING_ZONE_ID` / `CLOUDFLARE_R2_PRODUCTION_ZONE_ID` (required only with a custom domain)

Fallback shared names are also supported:

- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_ALLOWED_ORIGINS`
- `CLOUDFLARE_R2_CUSTOM_DOMAIN`
- `CLOUDFLARE_R2_ZONE_ID`

## CORS posture

For browser-based presigned URL flows, keep CORS narrow:

- origins: exact web origins only
- methods: only the verbs the presigned URL flow uses, typically `GET`, `PUT`, `HEAD`, and optionally `DELETE`
- headers: only the headers the client actually sends
- expose headers: only what the frontend needs to read

## References

- Cloudflare R2 bucket API
- Cloudflare R2 CORS API
- Cloudflare R2 custom-domain API
- Cloudflare R2 S3-compatible auth and endpoint model

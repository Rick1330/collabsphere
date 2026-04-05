#!/usr/bin/env bash

set -euo pipefail

deploy_environment="${DEPLOY_ENVIRONMENT:-unknown}"
vercel_cli_version="${VERCEL_CLI_VERSION:?VERCEL_CLI_VERSION is required.}"
vercel_org_id="${VERCEL_ORG_ID:-}"
vercel_project_id="${VERCEL_PROJECT_ID:-}"
primary_token="${VERCEL_TOKEN_PRIMARY:-}"
rollover_token="${VERCEL_TOKEN_ROLLOVER:-}"

if [[ -n "$primary_token" && -n "$rollover_token" ]]; then
  primary_digest="$(printf '%s' "$primary_token" | sha256sum | awk '{print $1}')"
  rollover_digest="$(printf '%s' "$rollover_token" | sha256sum | awk '{print $1}')"

  if [[ "$primary_digest" == "$rollover_digest" ]]; then
    echo "::error::VERCEL_TOKEN_ROLLOVER matches VERCEL_TOKEN for ${deploy_environment}. Configure a distinct independently issued rollover token or remove VERCEL_TOKEN_ROLLOVER."
    exit 1
  fi
fi

token_labels=()
token_values=()

if [[ -n "$primary_token" ]]; then
  token_labels+=("VERCEL_TOKEN")
  token_values+=("$primary_token")
fi

if [[ -n "$rollover_token" ]]; then
  token_labels+=("VERCEL_TOKEN_ROLLOVER")
  token_values+=("$rollover_token")
fi

if [[ "${#token_labels[@]}" -eq 0 ]]; then
  echo "::error::Missing Vercel token secret. Set VERCEL_TOKEN (or VERCEL_TOKEN_ROLLOVER) in the ${deploy_environment} environment."
  exit 1
fi

selected_label=""
selected_token=""

for index in "${!token_labels[@]}"; do
  label="${token_labels[$index]}"
  token="${token_values[$index]}"

  if auth_output="$(pnpm dlx "vercel@${vercel_cli_version}" whoami --token "$token" 2>&1)"; then
    selected_label="$label"
    selected_token="$token"
    break
  fi

  if echo "$auth_output" | grep -Eiq "(not valid|invalid token|authentication failed|unauthorized|\\b401\\b)"; then
    echo "::warning::${label} failed Vercel auth preflight for ${deploy_environment}; trying next configured token (if any)."
    continue
  fi

  echo "::error::Vercel auth preflight encountered a non-token error while validating ${label} for ${deploy_environment}: ${auth_output}"
  exit 1
done

if [[ -z "$selected_token" ]]; then
  echo "::error::No configured Vercel token passed authentication preflight. Rotate or update all configured Vercel token secrets (for example, VERCEL_TOKEN and VERCEL_TOKEN_ROLLOVER) for the ${deploy_environment} environment."
  exit 1
fi

if [[ -z "$vercel_org_id" || -z "$vercel_project_id" ]]; then
  echo "::error::VERCEL_ORG_ID and VERCEL_PROJECT_ID are required for Vercel deploy preflight."
  exit 1
fi

response_file="$(mktemp)"
cleanup() {
  rm -f "$response_file"
}
trap cleanup EXIT

vercel_project_api_url="https://api.vercel.com/v9/projects/${vercel_project_id}?teamId=${vercel_org_id}"
if ! vercel_http_status="$(
  curl --silent --show-error --output "$response_file" --write-out "%{http_code}" \
    --header "Authorization: Bearer ${selected_token}" \
    "$vercel_project_api_url"
)"; then
  echo "::error::Vercel project access preflight failed due to network/transport error while validating ${deploy_environment}."
  exit 1
fi

if [[ "$vercel_http_status" != "200" ]]; then
  response_preview="$(head -c 200 "$response_file" | tr '\n' ' ')"
  echo "::error::Unable to access Vercel project ${vercel_project_id} in org/team ${vercel_org_id} (HTTP ${vercel_http_status}). ${response_preview}"
  exit 1
fi

if [[ -n "$primary_token" && -z "$rollover_token" ]]; then
  echo "::notice::Only VERCEL_TOKEN is configured for ${deploy_environment}. Add a distinct VERCEL_TOKEN_ROLLOVER if you want a real fallback during rotation windows."
elif [[ -z "$primary_token" && -n "$rollover_token" ]]; then
  echo "::notice::Only VERCEL_TOKEN_ROLLOVER is configured for ${deploy_environment}. Consider restoring VERCEL_TOKEN as the primary secret after rotation."
else
  echo "Using ${deploy_environment} Vercel token source: ${selected_label} (distinct primary/rollover pair configured)."
fi

echo "::add-mask::$selected_token"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "token_source=$selected_label"
    echo "vercel_token=$selected_token"
  } >> "$GITHUB_OUTPUT"
fi

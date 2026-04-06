#!/usr/bin/env bash

set -euo pipefail

deploy_environment="${DEPLOY_ENVIRONMENT:-unknown}"
vercel_cli_version="${VERCEL_CLI_VERSION:?VERCEL_CLI_VERSION is required.}"
vercel_org_id="${VERCEL_ORG_ID:-}"
vercel_project_id="${VERCEL_PROJECT_ID:-}"
primary_token="${VERCEL_TOKEN_PRIMARY:-${VERCEL_TOKEN:-}}"
rollover_token="${VERCEL_TOKEN_ROLLOVER:-}"

mask_value() {
  if [[ -n "${1:-}" && "${GITHUB_ACTIONS:-}" == "true" ]]; then
    echo "::add-mask::$1"
  fi
}

if [[ -n "$primary_token" && -n "$rollover_token" && "$primary_token" == "$rollover_token" ]]; then
  echo "::error::VERCEL_TOKEN_ROLLOVER matches VERCEL_TOKEN for ${deploy_environment}. Configure a distinct independently issued rollover token or remove VERCEL_TOKEN_ROLLOVER." >&2
  exit 1
fi

token_labels=()
token_values=()

if [[ -n "$primary_token" ]]; then
  mask_value "$primary_token"
  token_labels+=("VERCEL_TOKEN")
  token_values+=("$primary_token")
fi

if [[ -n "$rollover_token" ]]; then
  mask_value "$rollover_token"
  token_labels+=("VERCEL_TOKEN_ROLLOVER")
  token_values+=("$rollover_token")
fi

if [[ "${#token_labels[@]}" -eq 0 ]]; then
  echo "::error::Missing Vercel token secret. Set VERCEL_TOKEN (or VERCEL_TOKEN_ROLLOVER) in the ${deploy_environment} environment." >&2
  exit 1
fi

selected_label=""
selected_token=""
response_file="$(mktemp)"
cleanup() {
  rm -f "$response_file"
}
trap cleanup EXIT

vercel_project_api_url="https://api.vercel.com/v9/projects/${vercel_project_id}?teamId=${vercel_org_id}"

if [[ -z "$vercel_org_id" || -z "$vercel_project_id" ]]; then
  echo "::error::VERCEL_ORG_ID and VERCEL_PROJECT_ID are required for Vercel deploy preflight." >&2
  exit 1
fi

for index in "${!token_labels[@]}"; do
  label="${token_labels[$index]}"
  token="${token_values[$index]}"

  if auth_output="$(pnpm dlx "vercel@${vercel_cli_version}" whoami --token "$token" 2>&1)"; then
    :
  elif echo "$auth_output" | grep -Eiq "(not valid|invalid token|authentication failed|unauthorized|\\b401\\b)"; then
    echo "::warning::${label} failed Vercel auth preflight for ${deploy_environment}; trying next configured token (if any)." >&2
    continue
  else
    echo "::debug::${label} auth preflight output: $auth_output"
    echo "::error::Vercel auth preflight encountered a non-token error while validating ${label} for ${deploy_environment}." >&2
    exit 1
  fi

  : > "$response_file"

  if ! vercel_http_status="$(
    curl --silent --show-error \
      --connect-timeout 10 \
      --max-time 30 \
      --output "$response_file" --write-out "%{http_code}" \
      --header "Authorization: Bearer ${token}" \
      "$vercel_project_api_url"
  )"; then
    echo "::error::Vercel project access preflight failed due to network/transport error while validating ${label} for ${deploy_environment}." >&2
    exit 1
  fi

  if [[ "$vercel_http_status" != "200" ]]; then
    echo "::warning::${label} authenticated but could not access Vercel project ${vercel_project_id} in ${deploy_environment}; trying next configured token (if any)." >&2
    continue
  fi

  selected_label="$label"
  selected_token="$token"
  mask_value "$selected_token"
  break
done

if [[ -z "$selected_token" ]]; then
  echo "::error::No configured Vercel token passed authentication and project-access preflight. Rotate or update the configured Vercel token secrets for the ${deploy_environment} environment." >&2
  exit 1
fi

if [[ -n "$primary_token" && -z "$rollover_token" ]]; then
  echo "::notice::Only VERCEL_TOKEN is configured for ${deploy_environment}. Add a distinct VERCEL_TOKEN_ROLLOVER if you want a real fallback during rotation windows."
elif [[ -z "$primary_token" && -n "$rollover_token" ]]; then
  echo "::notice::Only VERCEL_TOKEN_ROLLOVER is configured for ${deploy_environment}. Consider restoring VERCEL_TOKEN as the primary secret after rotation."
else
  echo "Using ${deploy_environment} Vercel token source: ${selected_label} (distinct primary/rollover pair configured)."
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "token_source=$selected_label"
    echo "vercel_token=$selected_token"
  } >> "$GITHUB_OUTPUT"
fi

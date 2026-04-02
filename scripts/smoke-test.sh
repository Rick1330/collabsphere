#!/usr/bin/env bash

set -euo pipefail

api_health_url="${API_HEALTH_URL:-}"
web_url="${WEB_URL:-}"
attempts="${SMOKE_TEST_ATTEMPTS:-24}"
delay_seconds="${SMOKE_TEST_DELAY_SECONDS:-5}"
connect_timeout_seconds="${SMOKE_TEST_CONNECT_TIMEOUT_SECONDS:-5}"
max_time_seconds="${SMOKE_TEST_MAX_TIME_SECONDS:-15}"
work_dir="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/collabsphere-smoke"

usage() {
  cat <<'EOF'
Usage:
  API_HEALTH_URL=<url> WEB_URL=<url> bash scripts/smoke-test.sh
EOF
}

if [[ -z "$api_health_url" || -z "$web_url" ]]; then
  usage >&2
  echo "API_HEALTH_URL and WEB_URL are required." >&2
  exit 1
fi

mkdir -p "$work_dir"

probe_url() {
  local url="$1"
  local body_path="$2"
  local headers_path="$3"

  curl \
    --silent \
    --show-error \
    --location \
    --connect-timeout "$connect_timeout_seconds" \
    --max-time "$max_time_seconds" \
    --output "$body_path" \
    --dump-header "$headers_path" \
    --write-out "%{http_code}" \
    "$url"
}

assert_backend_health_payload() {
  local body_path="$1"

  node -e '
    const fs = require("node:fs");
    const payload = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const resource = payload?.data?.resource;
    const checks = resource?.checks;

    if (resource?.service !== "api") {
      throw new Error("Health response did not identify the api service.");
    }

    if (resource?.status !== "healthy") {
      throw new Error(`API reported status ${resource?.status ?? "unknown"}.`);
    }

    if (checks?.database?.status !== "healthy") {
      throw new Error(`Database check reported ${checks?.database?.status ?? "unknown"}.`);
    }

    if (checks?.redis?.status !== "healthy") {
      throw new Error(`Redis check reported ${checks?.redis?.status ?? "unknown"}.`);
    }
  ' "$body_path"
}

wait_for_backend_health() {
  local body_path="$work_dir/api-health-body.json"
  local headers_path="$work_dir/api-health-headers.txt"
  local last_error=""

  for attempt in $(seq 1 "$attempts"); do
    local http_code
    if ! http_code="$(probe_url "$api_health_url" "$body_path" "$headers_path")"; then
      last_error="HTTP request to backend health URL failed."
    elif [[ "$http_code" != "200" ]]; then
      last_error="Backend health URL returned HTTP ${http_code}."
    elif ! assert_backend_health_payload "$body_path"; then
      last_error="Backend health payload did not report healthy dependencies."
    else
      echo "Backend smoke test passed via ${api_health_url}"
      return 0
    fi

    echo "Backend smoke test attempt ${attempt}/${attempts} not ready: ${last_error}" >&2
    if [[ "$attempt" -lt "$attempts" ]]; then
      sleep "$delay_seconds"
    fi
  done

  echo "Backend smoke test failed: ${last_error}" >&2
  if [[ -f "$body_path" ]]; then
    echo "Last backend response body:" >&2
    cat "$body_path" >&2
  fi
  exit 1
}

wait_for_web() {
  local body_path="$work_dir/web-body.txt"
  local headers_path="$work_dir/web-headers.txt"
  local last_error=""

  for attempt in $(seq 1 "$attempts"); do
    local http_code
    if ! http_code="$(probe_url "$web_url" "$body_path" "$headers_path")"; then
      last_error="HTTP request to web URL failed."
    elif [[ "$http_code" != "200" ]]; then
      last_error="Web URL returned HTTP ${http_code}."
    else
      echo "Web smoke test passed via ${web_url}"
      return 0
    fi

    echo "Web smoke test attempt ${attempt}/${attempts} not ready: ${last_error}" >&2
    if [[ "$attempt" -lt "$attempts" ]]; then
      sleep "$delay_seconds"
    fi
  done

  echo "Web smoke test failed: ${last_error}" >&2
  if [[ -f "$body_path" ]]; then
    echo "Last web response body:" >&2
    cat "$body_path" >&2
  fi
  exit 1
}

wait_for_backend_health
wait_for_web

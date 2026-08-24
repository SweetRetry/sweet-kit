#!/usr/bin/env bash

set -euo pipefail

readonly cdp_endpoint="http://127.0.0.1:9222/json/version"
readonly chrome_executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
readonly repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly user_data_directory="${repository_root}/.agent-browser/cdp-profile"

if curl --fail --silent --max-time 1 "${cdp_endpoint}" >/dev/null; then
  echo "CDP ready at http://127.0.0.1:9222"
  exit 0
fi

if [[ ! -x "${chrome_executable}" ]]; then
  echo "Google Chrome not found at ${chrome_executable}" >&2
  exit 1
fi

mkdir -p "${user_data_directory}"

open -na "Google Chrome" --args \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --user-data-dir="${user_data_directory}" \
  --no-first-run \
  --no-default-browser-check \
  about:blank

for _ in {1..50}; do
  if curl --fail --silent --max-time 1 "${cdp_endpoint}" >/dev/null; then
    echo "CDP ready at http://127.0.0.1:9222"
    exit 0
  fi

  sleep 0.1
done

echo "Chrome started, but CDP did not become ready at http://127.0.0.1:9222" >&2
exit 1

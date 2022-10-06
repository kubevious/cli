#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
export MY_DIR="$(dirname $MY_PATH)"

${MY_DIR}/../workspace.git/kubevious-repo-prepare.sh
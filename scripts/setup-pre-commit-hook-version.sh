#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd ${MY_DIR}/..

source version.sh

yq -i '.[].entry |= "kubevious/cli:'${PRODUCT_VERSION}'"' .pre-commit-hooks.yaml
#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd ${MY_DIR}/..

source version.sh

yq -i '.runs.image |= "docker://kubevious/cli:'${PRODUCT_VERSION}'"' action.yml
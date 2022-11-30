#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd ${MY_DIR}/../..

source configuration.sh

docker run \
    -it \
    --rm \
    --name "kubevious-cli" \
    -h "kubevious-cli" \
    -v ${MY_DIR}:/repo \
    kubevious/node-executable-builder:v1 bash
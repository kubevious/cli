#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

source configuration.sh

rm -rf ${BINARY_DIR}/*

NODE_VERSION=node14

TARGETS=()

TARGETS+=("${NODE_VERSION}-alpine-x64")
TARGETS+=("${NODE_VERSION}-alpine-arm64")

TARGETS+=("${NODE_VERSION}-linux-x64")
TARGETS+=("${NODE_VERSION}-linux-arm64")

TARGETS+=("${NODE_VERSION}-linuxstatic-x64")
TARGETS+=("${NODE_VERSION}-linuxstatic-arm64")

TARGETS+=("${NODE_VERSION}-win-x64")
TARGETS+=("${NODE_VERSION}-win-arm64")

TARGETS+=("${NODE_VERSION}-macos-x64")
TARGETS+=("${NODE_VERSION}-macos-arm64")

echo "TARGETS: ${TARGETS[@]}"

TARGETS_A=${TARGETS[*]}
TARGETS_STR=${TARGETS_A// /,}
# echo "TARGETS_STR: ${TARGETS_STR}"

pkg \
    --output ${BINARY_DIR}/kubevious \
    -t ${TARGETS_STR}\
    dist/index.js > logs

ls -la ${BINARY_DIR}/./
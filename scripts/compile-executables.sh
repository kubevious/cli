#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd ${MY_DIR}/..

source configuration.sh

rm -rf ${BINARY_DIR}/*

mkdir ${BINARY_DIR}

source version.sh

echo "${PRODUCT_VERSION}" > ${BINARY_DIR}/version

docker run \
    -it \
    --rm \
    --name "kubevious-cli" \
    -h "kubevious-cli" \
    -v ${MY_DIR}:/repo \
    -w /repo \
    kubevious/node-executable-builder:v1 bash -c 'pkg . --debug --no-bytecode'
RESULT=$?
if [ $RESULT -ne 0 ]; then
  echo "Failed to Build Packages"
  exit 1;
fi

ls -la ${BINARY_DIR}/
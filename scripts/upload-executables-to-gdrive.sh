#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd ${MY_DIR}/..

source configuration.sh

ls -la ${BINARY_DIR}/

export GDRIVE_ROOT_DIR=/Volumes/GoogleDrive-101642078490599194699
export GDRIVE_CLI_ROOT_DIR="${GDRIVE_ROOT_DIR}/Shared drives/IT/Product_Release/KubeviousCLI"

source version.sh

export GDRIVE_VERSION_DIR=${GDRIVE_CLI_ROOT_DIR}/v${PRODUCT_VERSION}

mkdir "${GDRIVE_VERSION_DIR}"

cp -rf "${BINARY_DIR}/" "${GDRIVE_VERSION_DIR}/"
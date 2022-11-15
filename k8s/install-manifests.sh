#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

source ${MY_DIR}/configuration.sh

echo ""
echo "*** "
echo "*** Setting Up CLI CRDs"
echo "*** "

MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

${K8S_DIR}/exec-kubectl.sh apply -f ${MY_DIR}/../manifests/

${K8S_DIR}/exec-kubectl.sh create namespace pepsi
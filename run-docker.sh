#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

source configuration.sh

docker run -i -v ${MY_DIR}/samples:/manifests ${IMAGE_NAME} $@

RESULT=$?
echo "RESULT: $RESULT"

# docker run kubevious-cli --help
# docker run kubevious-cli --version
# docker run -v ${PWD}/samples:/manifests kubevious-cli lint /manifests
# helm template traefik/traefik | docker run -i kubevious-cli lint

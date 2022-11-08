#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

export DEPS_REPO_DIR=${MY_DIR}/../../dependencies.git
export K8S_DIR=${DEPS_REPO_DIR}/k8s

source ${K8S_DIR}/configuration.sh
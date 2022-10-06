#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"

BINARY_DIR=${MY_DIR}/binary

## PLATFORM TARGETS
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
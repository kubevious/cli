#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

source configuration.sh

yarn install --frozen-lockfile
if [ $RESULT -ne 0 ]; then
  echo "Failed to download packages"
  exit 1;
fi

./build.sh
RESULT=$?
if [ $RESULT -ne 0 ]; then
  echo "Build failed"
  exit 1;
fi

pwd

./scripts/prepare-package.sh
RESULT=$?
if [ $RESULT -ne 0 ]; then
  echo "Prepare Package Failed"
  exit 1;
fi

./scripts/compile-executables.sh
RESULT=$?
if [ $RESULT -ne 0 ]; then
  echo "Compile Executables Failed"
  exit 1;
fi

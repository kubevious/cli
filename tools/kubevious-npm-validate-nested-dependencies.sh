#!/bin/bash

export MY_DIR=$(pwd)

echo "*** Kubevious Validate NPM Nested Dependencies..." 
echo "    REPO: ${MY_DIR}" 

unset FORCE_RESOLVE_DEPENDENCIES
source ${MY_DIR}/dependencies.sh

if [[ ! -d node_modules ]]; then
  echo "ERROR: no node_modules found" 
  exit 1;
fi;

for module in node_modules/@kubevious/*; do

  for DEP_NAME in "${FORCE_RESOLVE_DEPENDENCIES[@]}"
  do
    NESTED_DEP_PATH="${module}/node_modules/${DEP_NAME}"
    if [[ -d ${NESTED_DEP_PATH} ]]; then
      echo "ERROR: NESTED DEP -> ${NESTED_DEP_PATH}"
      exit 1
    fi
  done
  
done

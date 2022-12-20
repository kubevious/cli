#!/bin/sh

log() {
   echo "[KUBEVIOUS-DOCKER] $1"
}

getListArg() {
   echo "$1" | tr ',' ' '
}

isTrue() {
  [[ "$1" == "true" ]]
}

# MAIN

if isTrue "${CI}"
then

    if isTrue "$DRONE"
    then
        echo "Running in Drone..."

        MY_HELM_REPO_NAME="${PLUGIN_HELM_REPO_NAME}"
        MY_HELM_REPO_URL="${PLUGIN_HELM_REPO_URL}"
        MY_HELM_CHART="${PLUGIN_HELM_CHART}"
        MY_HELM_OVERRIDE="${PLUGIN_HELM_OVERRIDE}"
        MY_HELM_NAMESPACE="${PLUGIN_HELM_NAMESPACE}"
        MY_HELM_INCLUDE_CRDS="${PLUGIN_HELM_INCLUDE_CRDS}"
        MY_MANIFESTS="${PLUGIN_MANIFESTS}"
        MY_CRDS="${PLUGIN_CRDS}"
        MY_MOCKS="${PLUGIN_MOCKS}"
        MY_LIVE_K8S="${PLUGIN_LIVE_K8S}"
        MY_K8S_VERSION="${PLUGIN_K8S_VERSION}"
        MY_IGNORE_NON_K8S="${PLUGIN_IGNORE_NON_K8S}"
        MY_IGNORE_UNKNOWN="${PLUGIN_IGNORE_UNKNOWN}"
        MY_DETAILED_OUTPUT="${PLUGIN_DETAILED_OUTPUT}"
        MY_JSON_OUTPUT="${PLUGIN_JSON_OUTPUT}"
        MY_OTHER_ARGS="${PLUGIN_OTHER_ARGS}"
        MY_IS_DEBUG="${PLUGIN_IS_DEBUG}"

    elif isTrue "$GITHUB_ACTIONS"
    then
        echo "Running in GitHub Actions..."

        MY_HELM_REPO_NAME="${INPUT_HELM_REPO_NAME}"
        MY_HELM_REPO_URL="${INPUT_HELM_REPO_URL}"
        MY_HELM_CHART="${INPUT_HELM_CHART}"
        MY_HELM_OVERRIDE="${INPUT_HELM_OVERRIDE}"
        MY_HELM_NAMESPACE="${INPUT_HELM_NAMESPACE}"
        MY_HELM_INCLUDE_CRDS="${INPUT_HELM_INCLUDE_CRDS}"
        MY_MANIFESTS="${INPUT_MANIFESTS}"
        MY_CRDS="${INPUT_CRDS}"
        MY_MOCKS="${INPUT_MOCKS}"
        MY_LIVE_K8S="${INPUT_LIVE_K8S}"
        MY_K8S_VERSION="${INPUT_K8S_VERSION}"
        MY_IGNORE_NON_K8S="${INPUT_IGNORE_NON_K8S}"
        MY_IGNORE_UNKNOWN="${INPUT_IGNORE_UNKNOWN}"
        MY_DETAILED_OUTPUT="${INPUT_DETAILED_OUTPUT}"
        MY_JSON_OUTPUT="${INPUT_JSON_OUTPUT}"
        MY_OTHER_ARGS="${INPUT_OTHER_ARGS}"
        MY_IS_DEBUG="${INPUT_IS_DEBUG}"

    else  
        echo "Unknown CI Run..."

        MY_HELM_REPO_NAME=""
        MY_HELM_REPO_URL=""
        MY_HELM_CHART=""
        MY_HELM_OVERRIDE=""
        MY_HELM_NAMESPACE=""
        MY_HELM_INCLUDE_CRDS=""
        MY_MANIFESTS=""
        MY_CRDS=""
        MY_MOCKS=""
        MY_LIVE_K8S=""
        MY_K8S_VERSION=""
        MY_IGNORE_NON_K8S=""
        MY_IGNORE_UNKNOWN=""
        MY_DETAILED_OUTPUT=""
        MY_JSON_OUTPUT=""
        MY_OTHER_ARGS=""
        MY_IS_DEBUG=""
    fi  

    if isTrue "${MY_IS_DEBUG}"
    then
        echo "CURRENT DIRECTORY: "
        pwd
        echo "---"

        echo "CONTENTS: "
        ls -la
        echo "---"    
    fi

    if [[ ! -z "${MY_HELM_REPO_NAME}" ]] && [[ ! -z "${MY_HELM_REPO_URL}" ]]
    then
        log "RUNNING: helm repo add ${MY_HELM_REPO_NAME} ${MY_HELM_REPO_URL}"
        helm repo add ${MY_HELM_REPO_NAME} ${MY_HELM_REPO_URL}
    fi

    KUBEVIOUS_CMD="guard"

    if [[ ! -z "${MY_HELM_CHART}" ]]
    then
        if [[ ! -z "${MY_HELM_REPO_NAME}" ]]
        then
            KUBEVIOUS_CHART="${MY_HELM_REPO_NAME}/${MY_HELM_CHART}"
        else
            KUBEVIOUS_CHART="${MY_HELM_CHART}"
        fi
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} @helm@${KUBEVIOUS_CHART}"

        if [[ ! -z "${MY_HELM_OVERRIDE}" ]]
        then
            KUBEVIOUS_CMD="${KUBEVIOUS_CMD}@values=${MY_HELM_OVERRIDE}"
        fi

        if [[ ! -z "${MY_HELM_NAMESPACE}" ]]
        then
            KUBEVIOUS_CMD="${KUBEVIOUS_CMD}@namespace=${MY_HELM_NAMESPACE}"
        fi

        if isTrue "${MY_HELM_INCLUDE_CRDS}"
        then
            KUBEVIOUS_CMD="${KUBEVIOUS_CMD}@crds=include"
        fi
    fi

    if [[ ! -z "${MY_MANIFESTS}" ]]
    then
        KUBEVIOUS_VAR=$(getListArg "${MY_MANIFESTS}")
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${KUBEVIOUS_VAR}"
    fi

    if [[ ! -z "${MY_CRDS}" ]]
    then
        KUBEVIOUS_VAR=$(getListArg "${MY_CRDS}")
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${KUBEVIOUS_VAR}"
    fi

    if [[ ! -z "${MY_MOCKS}" ]]
    then
        KUBEVIOUS_VAR=$(getListArg "${MY_MOCKS}")
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${KUBEVIOUS_VAR}"
    fi

    if isTrue "${MY_LIVE_K8S}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --live-k8s"
    fi

    if [[ ! -z "${MY_K8S_VERSION}" ]]
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --k8s-version ${MY_K8S_VERSION}"
    fi

    if isTrue "${MY_IGNORE_NON_K8S}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --ignore-non-k8s"
    fi

    if isTrue "${MY_IGNORE_UNKNOWN}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --ignore-unknown"
    fi

    if isTrue "${MY_DETAILED_OUTPUT}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --detailed"
    fi

    if isTrue "${MY_JSON_OUTPUT}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --json"
    fi

    if [[ ! -z "${MY_OTHER_ARGS}" ]]
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${MY_OTHER_ARGS}"
    fi

    log "RUNNING: kubevious ${KUBEVIOUS_CMD}"

else
    KUBEVIOUS_CMD="$@"
fi

kubevious ${KUBEVIOUS_CMD}
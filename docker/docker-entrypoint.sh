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

if isTrue "$CI"
then

    if [[ ! -z "${PLUGIN_HELM_REPO_NAME}" ]] && [[ ! -z "${PLUGIN_HELM_REPO_URL}" ]]
    then
        log "RUNNING: helm repo add ${PLUGIN_HELM_REPO_NAME} ${PLUGIN_HELM_REPO_URL}"
        helm repo add ${PLUGIN_HELM_REPO_NAME} ${PLUGIN_HELM_REPO_URL}
    fi

    KUBEVIOUS_CMD="guard"

    if [[ ! -z "${PLUGIN_HELM_CHART}" ]]
    then
        if [[ ! -z "${PLUGIN_HELM_REPO_NAME}" ]]
        then
            KUBEVIOUS_CHART="${PLUGIN_HELM_REPO_NAME}/${PLUGIN_HELM_CHART}"
        else
            KUBEVIOUS_CHART="${PLUGIN_HELM_CHART}"
        fi
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} @helm@${KUBEVIOUS_CHART}"

        if [[ ! -z "${PLUGIN_HELM_OVERRIDE}" ]]
        then
            KUBEVIOUS_CMD="${KUBEVIOUS_CMD}@values=${PLUGIN_HELM_OVERRIDE}"
        fi

        if [[ ! -z "${PLUGIN_HELM_NAMESPACE}" ]]
        then
            KUBEVIOUS_CMD="${KUBEVIOUS_CMD}@namespace=${PLUGIN_HELM_NAMESPACE}"
        fi

        if isTrue "${PLUGIN_HELM_INCLUDE_CRDS}"
        then
            KUBEVIOUS_CMD="${KUBEVIOUS_CMD}@crds=include"
        fi
    fi

    if [[ ! -z "${PLUGIN_MANIFESTS}" ]]
    then
        KUBEVIOUS_VAR=$(getListArg "${PLUGIN_MANIFESTS}")
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${KUBEVIOUS_VAR}"
    fi

    if [[ ! -z "${PLUGIN_CRDS}" ]]
    then
        KUBEVIOUS_VAR=$(getListArg "${PLUGIN_CRDS}")
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${KUBEVIOUS_VAR}"
    fi

    if [[ ! -z "${PLUGIN_MOCKS}" ]]
    then
        KUBEVIOUS_VAR=$(getListArg "${PLUGIN_MOCKS}")
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${KUBEVIOUS_VAR}"
    fi

    if isTrue "${PLUGIN_LIVE_K8S}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --live-k8s"
    fi

    if [[ ! -z "${PLUGIN_K8S_VERSION}" ]]
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --k8s-version ${PLUGIN_K8S_VERSION}"
    fi

    if isTrue "${PLUGIN_IGNORE_NON_K8S}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --ignore-non-k8s"
    fi

    if isTrue "${PLUGIN_IGNORE_UNKNOWN}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --ignore-unknown"
    fi

    if isTrue "${PLUGIN_DETAILED_OUTPUT}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --detailed"
    fi

    if isTrue "${PLUGIN_JSON_OUTPUT}"
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} --json"
    fi

    if [[ ! -z "${PLUGIN_OTHER_ARGS}" ]]
    then
        KUBEVIOUS_CMD="${KUBEVIOUS_CMD} ${PLUGIN_OTHER_ARGS}"
    fi


    log "RUNNING: kubevious ${KUBEVIOUS_CMD}"

else
    KUBEVIOUS_CMD="$@"
fi

kubevious ${KUBEVIOUS_CMD}
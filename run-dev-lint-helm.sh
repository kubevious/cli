#!/bin/bash
MY_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
MY_DIR="$(dirname $MY_PATH)"
cd $MY_DIR

# helm repo add traefik https://helm.traefik.io/traefik
# helm repo add istio https://istio-release.storage.googleapis.com/charts
# helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm template traefik/traefik | ./run-dev.sh lint 

helm template istio/gateway | ./run-dev.sh lint

helm template prometheus-community/prometheus | ./run-dev.sh lint
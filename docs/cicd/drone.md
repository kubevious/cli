# Drone Integration

The workflow example below validates a directory of manifests and a Helm chart.

Learn more about flags and arguments here: https://plugins.drone.io/plugins/kubevious

```yaml
kind: pipeline
type: docker
name: default

steps:

- name: kubevious-file-check
  image: kubevious/cli
  settings:
    manifests: samples/argo-rollout
    crds: https://raw.githubusercontent.com/kubevious/demos/main/crds/argo-rollouts/crds.yaml
    
- name: kubevious-helm-check
  image: kubevious/cli
  settings:
    helm_repo_url: https://helm.kubevious.io
    helm_repo_name: kubevious
    helm_chart: kubevious
    helm_namespace: kubevious
    helm_include_crds: true
```
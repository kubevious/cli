# GitHub Actions Integration

The workflow example below validates a directory of manifests and a Helm chart.

See how it runs here: https://github.com/kubevious/cli/actions/workflows/test.yaml

```yaml
on: [push]

jobs:
  validation_run:
    runs-on: ubuntu-latest
    
    steps:
    
      - name: Checkout
        uses: actions/checkout@v3'
        
      - name: Validation of manifest files
        id: files-validation
        uses: kubevious/cli@main
        with:
          manifests: samples/argo-rollout
          crds: https://raw.githubusercontent.com/kubevious/demos/main/crds/argo-rollouts/crds.yaml        
          
      - name: Validation of Helm Charts
        id: chart-validation
        uses: kubevious/cli@main
        with:
          helm_repo_url: https://helm.kubevious.io
          helm_repo_name: kubevious
          helm_chart: kubevious
          helm_namespace: kubevious
          helm_include_crds: true
```


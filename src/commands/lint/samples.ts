import { ToolUsageSamples } from "../../screen/docs";

export const SAMPLES : ToolUsageSamples = [
    {
        title: 'Lint single file',
        code: 'kubevious lint sample.yaml',
    },
    {
        title: 'Lint directory and a file',
        code: 'kubevious lint manifests/ mock/sealed-secret.yaml',
    },
    {
        title: 'Lint HELM Chart',
        code: 'kubevious lint path/to/helm/chart',
    }, 
    {
        title: 'Lint HELM Chart with overrides',
        code: 'kubevious lint @helm@the-helm-chart@values=path/to/overrides.yaml',
    },   
    {
        title: 'Lint Custom Resource and CRD',
        code: 'kubevious lint my-resource.yaml my-crd.yaml',
    },  
    {
        title: 'Lint Custom Resources towards already configured CRDs in K8s Clutser',
        code: 'kubevious lint my-resource.yaml --live-k8s',
    },
    {
        title: 'Detailed output',
        code: 'kubevious lint --detailed @helm@traefik/traefik@namespace=traefik@release-name=traefik',
    },

]
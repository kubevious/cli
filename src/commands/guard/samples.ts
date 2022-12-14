import { ToolUsageSamples } from "../../screen/docs";

export const SAMPLES : ToolUsageSamples = [
    {
        title: 'Validate single file',
        code: 'kubevious guard sample.yaml',
    },
    {
        title: 'Validate directory and a file',
        code: 'kubevious guard manifests/ mock/sealed-secret.yaml',
    },
    {
        title: 'Validate HELM Chart',
        code: 'kubevious guard path/to/helm/chart',
    }, 
    {
        title: 'Validate HELM Chart with overrides',
        code: 'kubevious guard #helm@the-helm-chart@path/to/overrides.yaml',
    },   
    {
        title: 'Validate Custom Resource and CRD',
        code: 'kubevious guard my-resouce.yaml my-crd.yaml',
    },  
    {
        title: 'Validate Custom Resources towards already configured CRDs in K8s Clutser',
        code: 'kubevious guard my-resouce.yaml --live-k8s',
    },
]
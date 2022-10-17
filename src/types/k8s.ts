
export interface K8sObject
{
    apiVersion: string;
    kind: string;
    metadata?: K8sMetadata;
    [key : string] : any;
}

export interface K8sMetadata
{
    namespace?: string;
    name?: string;
}

export interface K8sObjectId
{
    apiVersion: string;
    kind: string;
    namespace?: string;
    name?: string;
}

export function makeId(k8sObject: K8sObject): K8sObjectId
{
    return { 
        apiVersion: k8sObject.apiVersion,
        kind: k8sObject.kind,
        namespace: k8sObject.metadata?.namespace,
        name: k8sObject.metadata?.name,
    }
}
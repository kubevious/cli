
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
import _ from 'the-lodash';
import { parseApiVersion } from "../utils/k8s";

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
    ownerReferences?: any[];
    [key : string] : any;
}

export interface K8sObjectKey
{
    apiVersion: string;
    kind: string;
    namespace?: string;
    name?: string;
}

export interface K8sObjectId
{
    apiVersion: string;
    api?: string;
    version: string;
    kind: string;
    namespace?: string;
    name?: string;
}

export function makeId(k8sObject: K8sObject): K8sObjectId
{
    const apiVersionParts = parseApiVersion(k8sObject.apiVersion);
    
    return { 
        apiVersion: k8sObject.apiVersion,
        api: apiVersionParts!.group,
        version: apiVersionParts!.version,
        kind: k8sObject.kind,
        namespace: k8sObject.metadata?.namespace,
        name: k8sObject.metadata?.name,
    }
}

export function makeK8sKey(k8sObject: K8sObject): K8sObjectKey
{
    return { 
        apiVersion: k8sObject.apiVersion,
        kind: k8sObject.kind,
        namespace: k8sObject.metadata?.namespace,
        name: k8sObject.metadata?.name,
    }
}

export function makeK8sKeyStr(k8sObject: K8sObject): string
{
    return _.stableStringify(makeK8sKey(k8sObject));
}
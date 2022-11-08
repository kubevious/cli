import _ from 'the-lodash';
import { K8sOpenApiResource } from "k8s-super-client";
import { K8sObject, K8sObjectId } from "../types/k8s";

export function parseApiVersion(apiVersion : string) : { group: string, version: string } | null
{
    const parts = apiVersion.split('/');
    if (parts.length === 1) {
        return {
            group: '',
            version: parts[0]
        }
    }
    if (parts.length === 2) {
        return {
            group: parts[0],
            version: parts[1]
        }
    }

    return null;
}

export function getApiResourceId(k8sManifest : K8sObject) : K8sOpenApiResource | null
{
    if (!k8sManifest.kind) {
        return null;
    }

    const apiVersionParts = parseApiVersion(k8sManifest.apiVersion);
    if (!apiVersionParts) {
        return null;
    }

    return {
        group: apiVersionParts.group,
        version: apiVersionParts.version,
        kind: k8sManifest.kind
    }
}

export function getJsonSchemaResourceKey(apiResource : K8sOpenApiResource) : string
{
    return _.stableStringify(apiResource);
}

export function isCRD(id: K8sObjectId)
{
    return (id.apiVersion === 'apiextensions.k8s.io/v1') && (id.kind === 'CustomResourceDefinition');
}
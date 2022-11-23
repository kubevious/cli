import { K8sManifest } from "../manifests/k8s-manifest";
import { KeyValueDict } from "./query-spec/k8s/k8s-target-query";

export interface RegistryQueryExecutor
{
    query(query: RegistryQueryOptions) : K8sManifest[]
}

export interface RegistryQueryOptions
{
    apiName?: string,
    version?: string,
    kind?: string,
    namespace?: string | null,

    nameFilters?: string[],
    labelFilters?: KeyValueDict[],
}

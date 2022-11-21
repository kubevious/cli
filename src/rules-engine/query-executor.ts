import { K8sManifest } from "../manifests/k8s-manifest";
import { K8sTargetFilter } from "./query-spec/k8s/k8s-target-query";

export interface RegistryQueryExecutor
{
    query(query: K8sTargetFilter) : K8sManifest[]
}
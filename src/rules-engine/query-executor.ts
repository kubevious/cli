import { K8sManifest } from "../manifests/k8s-manifest";
import { K8sTargetFilter } from "./target/k8s-target-builder";

export interface RegistryQueryExecutor
{
    query(query: K8sTargetFilter) : K8sManifest[]
}
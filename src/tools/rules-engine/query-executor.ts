import { K8sManifest } from "../manifest-package";
import { K8sTargetFilter } from "./target/k8s-target-builder";

export interface RegistryQueryExecutor
{
    query(query: K8sTargetFilter) : K8sManifest[]
}
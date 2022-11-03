import { K8sObject } from "../../types/k8s";
import { K8sTargetFilter } from "./target/k8s-target-builder";

export interface RegistryQueryExecutor
{
    query(query: K8sTargetFilter) : K8sObject[]
}
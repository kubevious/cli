import { K8sMetadata } from "../../types/k8s";

export type RuleOverrideValues = Record<string, any>;

export interface RuleDependency
{
    name: string,
    minVersion?: string,
    maxVersion?: string,
    range?: string,
}

export type RuleDependencies = RuleDependency[];

export interface BaseRuleK8sSpec
{
    target: string,
    globalCache?: string,
    cache?: string,
    rule: string,

    summary?: string,
    description?: string,
    disabled?: boolean,

    values?: RuleOverrideValues,
    dependencies?: RuleDependencies,
}
export interface ClusterRuleK8sSpec extends BaseRuleK8sSpec
{
    application?: ClusterRuleApplication,
}

export interface ClusterRuleApplication {
    clustered?: false,
    useApplicator?: false,
    onlySelectedNamespaces?: false,
    namespaces?: {
        name: string,
        values: RuleOverrideValues
    }[],
}

export interface RuleK8sSpec extends BaseRuleK8sSpec
{
    
}

export interface RuleApplicatorK8sSpec
{
    clusterRuleRef: {
        name: string
    },
    description?: string,
    disabled?: boolean,
    values?: RuleOverrideValues
}

export interface LibraryRuleRefK8sSpec
{
    name: string,
    path: string,
    category: string,
    summary: string,
}

export interface LibraryK8sSpec
{
    rules: LibraryRuleRefK8sSpec[];
}


export interface LibraryK8sObject
{
    apiVersion: string;
    kind: string;
    metadata?: K8sMetadata;
    spec: LibraryK8sSpec;
}
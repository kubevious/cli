import { K8sManifest } from "../../manifests/k8s-manifest";
import { ManifestSourceId } from "../../types/manifest";
import { ClusterRuleK8sSpec, RuleApplicatorK8sSpec, RuleDependencies, RuleK8sSpec, RuleOverrideValues } from "../spec/rule-spec";

export enum RuleKind {
    ClusterRule = 'ClusterRule',
    Rule = 'Rule',
    RuleApplicator = 'RuleApplicator',
}

export interface RuleObject {
    source: ManifestSourceId,
    kind: RuleKind;
    namespace?: string;
    name: string;
    target: string;
    globalCache?: string;
    cache?: string;
    script: string;
    values: RuleOverrideValues;
}

export interface RuleApplicationScope {
    namespace?: string;
}

export interface CommonRule {
    manifest: K8sManifest,

    source: ManifestSourceId,
    kind: RuleKind;
    name: string;

    target: string;
    globalCache?: string;
    cache?: string;
    script: string;

    values: RuleOverrideValues;

    isDisabled: boolean;
    dependencies: RuleDependencies;
    hasUnmedDependency: boolean;
}

export interface ClusterRule extends CommonRule {
    application?: RuleApplicationScope; 

    clustered: boolean;
    useApplicator: boolean;
    onlySelectedNamespaces: boolean;
    namespaces: Record<string, {
        values: RuleOverrideValues
    }>;

    spec: ClusterRuleK8sSpec;
}

export interface NamespaceRule extends CommonRule {
    namespace: string;
    application?: RuleApplicationScope; 

    spec: RuleK8sSpec;
}

export interface ApplicatorRule {
    manifest: K8sManifest,
    source: ManifestSourceId,
    kind: RuleKind;
    namespace: string;
    name: string;
    application?: RuleApplicationScope; 
    values: RuleOverrideValues;

    spec: RuleApplicatorK8sSpec;
}

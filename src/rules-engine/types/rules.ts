import { ManifestSourceId } from "../../types/manifest";
import { ClusterRuleK8sSpec, RuleApplicatorK8sSpec, RuleK8sSpec, RuleOverrideValues } from "../spec/rule-spec";

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
    script: string;
    values: RuleOverrideValues;
}

export interface RuleApplicationScope {
    namespace?: string;
}

export interface ClusterRule {
    source: ManifestSourceId,
    kind: RuleKind;
    name: string;
    application?: RuleApplicationScope; 
    target: string;
    script: string;
    values: RuleOverrideValues;


    useApplicator: boolean;
    onlySelectedNamespaces: boolean;
    namespaces: Record<string, {
        values: RuleOverrideValues
    }>;

    spec: ClusterRuleK8sSpec;
}

export interface NamespaceRule {
    source: ManifestSourceId,
    kind: RuleKind;
    namespace: string;
    name: string;
    application?: RuleApplicationScope; 
    target: string;
    script: string;
    values: RuleOverrideValues;

    spec: RuleK8sSpec;
}


export interface ApplicatorRule {
    source: ManifestSourceId,
    kind: RuleKind;
    namespace: string;
    name: string;
    application?: RuleApplicationScope; 
    values: RuleOverrideValues;

    spec: RuleApplicatorK8sSpec;
}

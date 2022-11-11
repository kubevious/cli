import { K8sApiSchemaFetcherResult } from "../../api-schema/k8s-api-schema-fetcher";
import { ManifestPackage } from "../../manifests/manifest-package";
import { RulesRuntime } from "../../rules-engine/execution/rules-runtime";
import { K8sObjectId } from "../../types/k8s";
import { ManifestSourceId } from "../../types/manifest";
import { RuleKind } from "../../rules-engine/registry/types";
import { LintCommandOptions, LintManifestsResult } from "../lint/types";

export interface GuardCommandOptions extends LintCommandOptions {

    includeRemoteTargets: boolean;
    
    skipLocalRules: boolean;

    skipRemoteRules: boolean;

    areNamespacesSpecified: boolean;
    namespace?: string;
    namespaces: string[];
    skipClusterScope: boolean;

}

export interface GuardCommandData {
    manifestPackage: ManifestPackage,
    k8sSchemaInfo: K8sApiSchemaFetcherResult,
    rulesRuntime: RulesRuntime,
}

export interface GuardResult
{
    success: boolean;

    lintResult: LintManifestsResult;
    
    ruleSuccess: boolean;
    rules: LintRuleResult[];

    counters: {
        rules: {
            total: number,
            failed: number,
            passed: number,
            withErrors: number,
            withWarnings: number
        },
        manifests: {
            total: number,
            processed: number,
            passed: number,
            withErrors: number,
            withWarnings: number
        }
    }
    
}

export interface LintRuleResult
{
    source: ManifestSourceId,
    kind: RuleKind;
    namespace?: string;
    rule: string;
    compiled: boolean;
    pass: boolean;
    hasViolationErrors: boolean;
    hasViolationWarnings: boolean;
    errors?: string[];
    violations?: LintRuleViolation[];
    passed: {
        manifest: K8sObjectId;
        source: ManifestSourceId;
    }[];
}

export interface LintRuleViolation
{
    manifest: K8sObjectId;
    source: ManifestSourceId;
    errors?: string[];
    warnings?: string[];
}
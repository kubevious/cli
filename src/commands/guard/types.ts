import { K8sApiSchemaFetcherResult } from "../../tools/k8s-api-schema-fetcher";
import { ManifestPackage } from "../../tools/manifest-package";
import { RulesRuntime } from "../../tools/rules-engine/rules-runtime";
import { K8sObjectId } from "../../types/k8s";
import { ManifestSourceId } from "../../types/manifest";
import { RuleKind } from "../../tools/rules-engine/types/rules";
import { LintManifestsResult } from "../lint/types";

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
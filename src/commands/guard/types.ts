import { K8sApiSchemaFetcherResult } from "../../tools/k8s-api-schema-fetcher";
import { ManifestPackage } from "../../tools/manifest-package";
import { RulesRuntime } from "../../tools/rules-engine/rules-runtime";
import { K8sObjectId } from "../../types/k8s";
import { ManifestSourceId } from "../../types/manifest";
import { LintManifestsResult } from "../lint/types";

export interface GuardCommandData {
    manifestPackage: ManifestPackage,
    k8sSchemaInfo: K8sApiSchemaFetcherResult,
    rulesRuntime: RulesRuntime,
}

export interface GuardResult extends LintManifestsResult
{
    rules: LintRuleResult[];
}

export interface LintRuleResult
{
    rule: string;
    compiled: boolean;
    pass: boolean;
    errors?: string[];
    violations?: LintRuleViolation[];
}

export interface LintRuleViolation
{
    manifest: K8sObjectId;
    source: ManifestSourceId;
    errors?: string[];
    warnings?: string[];
}
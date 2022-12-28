import { K8sApiSchemaFetcherResult } from "../../api-schema/k8s-api-schema-fetcher";
import { ManifestPackage } from "../../manifests/manifest-package";
import { RulesRuntime } from "../../rules-engine/execution/rules-runtime";
import { LintCommandOptions, LintManifestsResult } from "../lint/types";
import { LocalK8sRegistry } from "../../registry/local-k8s-registry";
import { ResultObject, RuleEngineCounters } from "../../types/result";
import { RuleEngineResult } from "../../types/rules-result";

export interface GuardCommandOptions extends LintCommandOptions {

    includeRemoteTargets: boolean;
    
    skipLocalRules: boolean;

    skipRemoteRules: boolean;

    skipRules: string[];
    onlyRules: string[];
    skipRuleCategories: string[];
    onlyRuleCategories: string[];

    areNamespacesSpecified: boolean;
    namespace?: string;
    namespaces: string[];
    skipClusterScope: boolean;

    skipCommunityRules: boolean;
    skipRuleLibraries: boolean;
}

export interface GuardCommandData extends ResultObject {
    manifestPackage: ManifestPackage,
    k8sSchemaInfo: K8sApiSchemaFetcherResult,
    rulesRuntime: RulesRuntime,

    localK8sRegistry: LocalK8sRegistry,

    lintResult: LintManifestsResult,
    rulesResult: RuleEngineResult
}

export interface GuardResult extends ResultObject
{
    success: boolean;

    lintResult: LintManifestsResult;
    
    rules: RuleEngineResult;

    counters: RuleEngineCounters;
}

import { ManifestResult } from "./manifest-result";
import { ResultObject, ResultObjectSeverity } from "./result";

export interface RuleEngineResult extends ResultObject
{
    success: boolean;
    rules: RuleResult[];
}


export interface RuleResult
{
    ruleManifest: ManifestResult,
    namespace?: string,
    compiled: boolean;
    pass: boolean;
    ruleSeverity : ResultObjectSeverity;
    hasViolationErrors: boolean;
    hasViolationWarnings: boolean;
    errors?: string[];
    violations: ManifestResult[];
    passed: ManifestResult[];
}

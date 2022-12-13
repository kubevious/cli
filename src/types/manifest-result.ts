
import { K8sObjectId } from "./k8s";
import { ResultObject } from "./result";
import { SourceInfoResult, SourceResult } from "./source-result";

export interface ManifestInfoResult extends K8sObjectId, ResultObject
{
}

export interface ManifestResult extends ManifestInfoResult
{
    sources: SourceInfoResult[];
}

export interface ManifestPackageResult extends ResultObject
{
    manifests: ManifestResult[];
    sources: SourceResult[];
}

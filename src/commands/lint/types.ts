import { K8sApiSchemaFetcherResult } from "../../api-schema/k8s-api-schema-fetcher";
import { InputSourceExtractor } from "../../input/input-source-extractor";
import { K8sClusterConnector } from "../../k8s-connector/k8s-cluster-connector";
import { ManifestPackage } from "../../manifests/manifest-package";
import { ManifestLoader } from "../../manifests/manifests-loader";
import { ManifestPackageCounters, ManifestPackageResult, ResultObject } from "../../types/result";

export interface LintCommandOptions {
    k8sVersion?: string;
    ignoreUnknown: boolean;
    ignoreNonK8s: boolean;
    stream: boolean;
    skipApplyCrds: boolean;

    liveK8s: boolean;
    kubeconfig?: string;
}


export interface LintCommandData {
    k8sConnector: K8sClusterConnector,
    manifestPackage: ManifestPackage,
    k8sSchemaInfo: K8sApiSchemaFetcherResult,

    inputSourceExtractor: InputSourceExtractor,
    manifestLoader: ManifestLoader,
}

export type LintSeverity = 'pass' | 'fail' | 'warning';
export interface LintStatus
{
    success: boolean,
    severity: LintSeverity,
    errors?: string[],
    warnings?: string[]
}

export interface LintManifestsResult extends ResultObject
{
    success: boolean;

    targetK8sVersion?: string;
    selectedK8sVersion?: string;
    foundK8sVersion: boolean;
    foundExactK8sVersion: boolean;

    packageResult: ManifestPackageResult;

    counters: ManifestPackageCounters;
}
import { K8sApiSchemaFetcherResult } from "../../api-schema/k8s-api-schema-fetcher";
import { K8sClusterConnector } from "../../k8s-connector/k8s-cluster-connector";
import { InputSourceExtractor } from "../../manifests/input-source-extractor";
import { ManifestPackage } from "../../manifests/manifest-package";
import { ManifestLoader } from "../../manifests/manifests-loader";
import { K8sObjectId } from "../../types/k8s";
import { ManifestSourceId } from "../../types/manifest";

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
    success: boolean,
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

export interface LintManifestsResult
{
    success: boolean;

    targetK8sVersion?: string;
    selectedK8sVersion?: string;
    foundK8sVersion: boolean;
    foundExactK8sVersion: boolean;

    sources: LintSourceResult[];

    counters: {
        sources: {
            total: number,
            withErrors: number,
            withWarnings: number
        },
        manifests: {
            total: number,
            passed: number,
            withErrors: number,
            withWarnings: number
        }
    }
}

export type LintSourceResult = ManifestSourceId & LintStatus & {
    manifestCount: number;

    manifests: LintManifestResult[];
};

export type LintManifestResult = K8sObjectId & LintStatus;


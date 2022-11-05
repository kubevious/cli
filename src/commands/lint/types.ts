import { K8sApiSchemaFetcherResult } from "../../tools/k8s-api-schema-fetcher";
import { ManifestPackage } from "../../tools/manifest-package";
import { K8sObjectId } from "../../types/k8s";
import { ManifestSourceId } from "../../types/manifest";

export interface LintCommandData {
    manifestPackage: ManifestPackage,
    k8sSchemaInfo: K8sApiSchemaFetcherResult,
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


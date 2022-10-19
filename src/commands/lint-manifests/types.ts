import { K8sObjectId } from "../../types/k8s";
import { ManifestSourceId } from "../../types/manifest";

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
}

export type LintSourceResult = ManifestSourceId & LintStatus & {
    manifestCount: number;

    manifests: LintManifestResult[];
};

export type LintManifestResult = K8sObjectId & LintStatus;
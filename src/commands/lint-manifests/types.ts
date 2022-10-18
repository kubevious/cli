import { K8sObjectId } from "../../types/k8s";
import { ErrorStatus, ManifestSourceId } from "../../types/manifest";

export interface LintManifestsResult
{
    success: boolean;

    targetK8sVersion?: string;
    selectedK8sVersion?: string;
    foundK8sVersion: boolean;
    foundExactK8sVersion: boolean;

    sources: LintSourceResult[];
}

export type LintSourceResult = ManifestSourceId & ErrorStatus & {
    manifestCount: number;

    manifests: LintManifestResult[];
};

export type LintManifestResult = K8sObjectId & ErrorStatus;
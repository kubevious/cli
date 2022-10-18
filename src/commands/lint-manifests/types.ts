import { K8sObjectId } from "../../types/k8s";
import { ErrorStatus, ManifestSourceId } from "../../types/manifest";

export interface LintManifestsResult
{
    success: boolean;

    sources: LintSourceResult[];
}

export type LintSourceResult = ManifestSourceId & ErrorStatus & {
    manifestCount: number;

    manifests: LintManifestResult[];
};

export type LintManifestResult = K8sObjectId & ErrorStatus;
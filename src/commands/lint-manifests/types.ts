import { K8sObjectId } from "../../types/k8s";
import { ErrorStatus, ManifestSourceId } from "../../types/manifest";

export interface LintManifestsResult
{
    success: boolean;

    sources: (ManifestSourceId & ErrorStatus & {
        manifestCount: number,

        manifests: (K8sObjectId & ErrorStatus & {
            source: ManifestSourceId
        })[]
        
    })[];

    manifests: (K8sObjectId & ErrorStatus & {
        source: ManifestSourceId
    })[];

}
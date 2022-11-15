import { K8sManifest } from "../../manifests/k8s-manifest";
import { ManifestPackage } from "../../manifests/manifest-package";
import { GuardCommandData, GuardResult } from "../guard/types";

export interface IndexLibraryCommandOptions  {

}

export interface IndexLibraryCommandData {
    manifestPackage: ManifestPackage,
    guardCommandData: GuardCommandData,

    libraryDir: string,
    rules: K8sManifest[],
}

export interface IndexLibraryResult
{
    success: boolean;

    guardResult: GuardResult;

    libraryRules: LibraryRuleRef[];
}

export interface LibraryRuleRef
{
    kind: string,
    name: string,
    path: string
}

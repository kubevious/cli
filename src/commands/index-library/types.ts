import { K8sManifest } from "../../manifests/k8s-manifest";
import { ManifestPackage } from "../../manifests/manifest-package";
import { LibraryK8sObject, LibraryRuleRefK8sSpec } from "../../rules-engine/spec/rule-spec";
import { GuardCommandData, GuardResult } from "../guard/types";

export interface IndexLibraryCommandOptions  {

}

export interface IndexLibraryCommandData {
    success: boolean,
    manifestPackage: ManifestPackage,
    guardCommandData: GuardCommandData,

    libraryDir: string,
    libraryPath: string,
    libraryObject : LibraryK8sObject,
    rules: K8sManifest[],
}

export interface IndexLibraryResult
{
    success: boolean;

    guardResult: GuardResult;

    libraryPath: string,
    libraryRules: LibraryRuleRefK8sSpec[];
}


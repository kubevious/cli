import { K8sManifest } from "../../manifests/k8s-manifest";
import { ManifestPackage } from "../../manifests/manifest-package";
import { LibraryRuleRefK8sSpec } from "../../rules-engine/spec/rule-spec";
import { GuardCommandData, GuardResult } from "../guard/types";

export interface IndexLibraryCommandOptions  {

}

export interface IndexLibraryCommandData {
    success: boolean,
    manifestPackage: ManifestPackage,
    guardCommandData: GuardCommandData,

    libraryDir: string,
    libraryPath: string,
    library: LibraryResult,
    rules: K8sManifest[],
}

export interface IndexLibraryResult
{
    success: boolean;

    guardResult: GuardResult;

    libraryPath: string,
    library: LibraryResult,
}

export interface LibraryResult
{
    categories: LibraryResultCategory[];
}

export interface LibraryResultCategory
{
    name: string;
    rules: LibraryRuleRefK8sSpec[];
}

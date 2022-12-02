import { ManifestPackage } from "../../manifests/manifest-package";
import { ClusterRuleK8sSpec } from "../../rules-engine/spec/rule-spec";
import { GuardCommandData, GuardResult } from "../guard/types";

export interface IndexLibraryCommandOptions  {

}

export interface IndexLibraryCommandData {
    success: boolean,
    manifestPackage: ManifestPackage,
    guardCommandData: GuardCommandData,

    libraryDir: string,
    libraryPath: string,
    library: Library,
}

export interface IndexLibraryResult
{
    success: boolean;

    guardResult: GuardResult;

    libraryPath: string,
    library: Library,
}


export interface LibraryRule
{
    title: string,
    name: string,
    path: string,
    category: string,
    summary: string,
    description: string,

    ruleSpec: ClusterRuleK8sSpec,
}

export interface LibraryCategory
{
    name: string;
    count: number;
    rules: LibraryRule[];
}

export interface Library
{
    count: number;
    categoryCount: number;
    categories: LibraryCategory[];
}
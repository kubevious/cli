import { ManifestSourceType } from "./manifest";
import { ManifestInfoResult } from "./manifest-result";
import { ResultObject } from "./result";

export interface SourceInfoResult extends ResultObject
{
    kind: ManifestSourceType;
    path: string;
}

export interface SourceResult extends SourceInfoResult
{
    children?: SourceResult[];
    manifests?: ManifestInfoResult[];
}

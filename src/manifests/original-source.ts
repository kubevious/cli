import { ManifestSourceType } from "../types/manifest";
import { InputSource } from "./input-source";

export class OriginalSource
{
    public kind: ManifestSourceType;
    public path: string;

    public innerSources : InputSource[] = [];
    
    constructor(kind: ManifestSourceType, path: string)
    {
        this.kind = kind;
        this.path = path;
    }
}
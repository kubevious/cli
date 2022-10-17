export type ManifestSourceType = "file" | "http";

export interface ErrorStatus
{
    success: boolean,
    errors?: string[]
}

export interface ManifestSourceId
{
    kind: ManifestSourceType;
    path: string;
}

export interface ManifestId
{
    apiVersion: string;
    kind: string;
    namespace?: string;
    name?: string;
}

export type ManifestSourceType = "file" | "web" | "stream" | "k8s";

export interface ErrorStatus
{
    success: boolean,
    errors?: string[],
    warnings?: string[]
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

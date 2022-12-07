export type ManifestSourceType = "file" | "web" | "stream" | "k8s" | "root";

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

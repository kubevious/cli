import { ScriptItem } from "../script-item";

export interface BaseTargetQuery
{
    kind: TargetQueryKind;
}

export interface SyncBaseTargetQuery extends BaseTargetQuery
{
    many() : ScriptItem[];
    single() : ScriptItem | null;
    count() : number;
}

export enum TargetQueryKind
{
    K8s = 'K8s',
    Union = 'Union',
    Transform = 'Transform',
}

export enum TopLevelQuery
{
    ApiVersion = 'ApiVersion',
    Api = 'Api',

    Union = 'Union',
    Transform = 'Transform',
}

export interface QueryScopeLimiter
{
    namespace?: string | null | undefined;
}

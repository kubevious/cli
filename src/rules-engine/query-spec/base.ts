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
    Shortcut = 'Shortcut',

    K8s = 'K8s',

    Union = 'Union',
    Transform = 'Transform',
    TransformMany = 'TransformMany',
    Filter = 'Filter',
    First = 'First',

    Manual = 'Manual',
}

export interface QueryScopeLimiter
{
    namespace?: string | null | undefined;
}

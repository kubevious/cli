import { ExecutionContext } from '../execution/execution-context';
import { BaseTargetQuery, TargetQueryKind } from './base';


export interface KeyValueDict {
    [name: string]: string
}

export interface K8sTargetBuilderContext
{
    namespace? : string;
}

export interface K8sTargetFilter
{
    isApiVersion: boolean,
    apiVersion?: string,
    apiOrNone?: string,
    version?: string,
    kind?: string,
    namespace?: string,
    isAllNamespaces?: boolean,

    nameFilters?: string[],
    labelFilters?: KeyValueDict[],
}

export class K8sTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.K8s;
    protected _executionContext: ExecutionContext;
    protected _builderContext : K8sTargetBuilderContext;

    _data : K8sTargetFilter = {
        isApiVersion: true,
        nameFilters: [],
        labelFilters: [],
    }

    constructor(executionContext: ExecutionContext, builderContext: K8sTargetBuilderContext)
    {
        this._executionContext = executionContext;
        this._builderContext = builderContext;
    }

    get kind() {
        return this._kind;
    }

    ApiVersion(apiVersion: string)
    {
        this._data.isApiVersion = true;
        this._data.apiVersion = apiVersion;
        return this;
    }

    Api(apiOrNone?: string)
    {
        this._data.isApiVersion = false;
        this._data.apiOrNone = apiOrNone;
        return this;
    }

    Version(version: string)
    {
        this._data.version = version;
        return this;
    }

    Kind(kind: string)
    {
        this._data.kind = kind;
        return this;
    }

    namespace(value: string)
    {
        this._data.namespace = value;
        return this;
    }

    allNamespaces()
    {
        this._data.isAllNamespaces = true;
        return this;
    }

    name(value: string)
    {
        this._data.nameFilters!.push(value);
        return this;
    }

    label(key: string, value: string) {
        const filter: KeyValueDict = {};
        filter[key] = value;
        return this.labels(filter)
    }

    labels(value: KeyValueDict) {
        this._data.labelFilters!.push(value)
        return this
    }

}
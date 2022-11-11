import { ExecutionContext } from '../execution/execution-context';
import { Scope, ScopeQueryKind } from '../scope'


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

export interface ScopeK8sQuery
{
    kind: ScopeQueryKind.K8s,
    filter: K8sTargetFilter
}

export class K8sTargetBuilder
{
    protected _scope : Scope;
    protected _executionContext: ExecutionContext;
    protected _builderContext : K8sTargetBuilderContext;

    private _data : K8sTargetFilter = {
        isApiVersion: true,
        nameFilters: [],
        labelFilters: [],
    }

    constructor(scope : Scope, executionContext: ExecutionContext, builderContext: K8sTargetBuilderContext)
    {
        this._scope = scope;
        this._executionContext = executionContext;
        this._builderContext = builderContext;

        scope.registerFinalizer(this._finalize.bind(this));
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

    private _finalize()
    {
        if (!this._data.kind) {
            console.log("No Kind");
            return;
        }

        const apiVersion = this._data.isApiVersion ? this._data.apiVersion : 
            (this._data.apiOrNone ? `${this._data.apiOrNone}/${this._data.version}` : this._data.version);
        if (!apiVersion) {
            console.log("No ApiVersion");
            return;
        }

        const query : ScopeK8sQuery = {
            kind: ScopeQueryKind.K8s,
            filter: {
                isApiVersion: true,
                apiVersion: apiVersion,
                kind: this._data.kind,
                namespace: this._data.namespace,
                isAllNamespaces: this._data.isAllNamespaces,
            
                nameFilters: this._data.nameFilters,
                labelFilters: this._data.labelFilters,
            }
        }

        this._scope.setupQuery(query);
    }

}

export class K8sTarget
{
    protected _scope : Scope;
    protected _executionContext: ExecutionContext;
    
    constructor(scope: Scope, executionContext: ExecutionContext)
    {
        this._scope = scope;
        this._executionContext = executionContext;
    }

    ApiVersion(apiVersion: string)
    {
        const builder = this._makeTargetBuilder();
        builder.ApiVersion(apiVersion);
        return builder;
    }

    Api(apiOrNone?: string)
    {
        const builder = this._makeTargetBuilder();
        builder.Api(apiOrNone);
        return builder;
    }

    protected _makeTargetBuilder()
    {
        return new K8sTargetBuilder(this._scope, this._executionContext, {});
    }

}
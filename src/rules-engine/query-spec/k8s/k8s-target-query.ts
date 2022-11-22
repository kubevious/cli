import { parseApiVersion } from '../../../utils/k8s';
import { BaseTargetQuery, TargetQueryKind } from '../base';

export interface KeyValueDict {
    [name: string]: string
}

export interface K8sTargetFilter
{
    apiName?: string,
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

    _data : K8sTargetFilter = {
        nameFilters: [],
        labelFilters: [],
    }

    get kind() {
        return this._kind;
    }

    ApiVersion(apiVersion: string)
    {
        const parsed = parseApiVersion(apiVersion);
        if (!parsed) {
            throw new Error(`Invalid apiVersion: ${apiVersion}`);
        }
        this._data.apiName = parsed.group;
        this._data.version = parsed.version;
        return this;
    }

    Api(apiName: string)
    {
        this._data.apiName = apiName;
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
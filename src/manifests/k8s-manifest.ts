import _ from 'the-lodash';
import { BaseObject } from '../types/base-object';
import { K8sObject, K8sObjectId, makeId, makeK8sKeyStr } from "../types/k8s";
import { ManifestSource } from './manifest-source';

export interface K8sManifestRuleResult
{
    processed?: boolean;
    errors?: boolean;
    warnings?: boolean;
}

export class K8sManifest extends BaseObject 
{
    private _idKey: string;
    private _id: K8sObjectId;

    private _config: K8sObject;
    private _source: ManifestSource;

    private _isLinted = false;
    private _rules: K8sManifestRuleResult = {};
    private _errorsWithRule?: boolean | undefined;

    constructor(config: K8sObject, source: ManifestSource)
    {
        super();

        this._config = config;
        this._source = source;
        this._id = makeId(config);
        this._idKey = makeK8sKeyStr(config);
    }

    public get id(): K8sObjectId {
        return this._id;
    }

    public get idKey(): string {
        return this._idKey;
    }

    public get config(): K8sObject {
        return this._config;
    }

    public get source(): ManifestSource {
        return this._source; 
    }

    public get isLinted() {
        return this._isLinted;
    }

    public set isLinted(value) {
        this._isLinted = value;
    }

    public get errorsWithRule(): boolean | undefined {
        return this._errorsWithRule;
    }
    public set errorsWithRule(value: boolean | undefined) {
        this._errorsWithRule = value;
    }

    public get rules(): K8sManifestRuleResult {
        return this._rules;
    }
   
}
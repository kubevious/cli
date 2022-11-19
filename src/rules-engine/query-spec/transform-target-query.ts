import { K8sObject } from '../../types/k8s';
import { ScriptItem } from '../script-item';
import { BaseTargetQuery, TargetQueryKind } from './base';

export type TransformerFunc = (item: ScriptItem) => K8sObject;

export class TransformTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.Transform;

    _inner: BaseTargetQuery;
    _func?: TransformerFunc;

    constructor(inner: BaseTargetQuery)
    {
        this._inner = inner;
    }
    
    get kind() {
        return this._kind;
    }

    To(func: TransformerFunc)
    {
        this._func = func;
        return this;
    }

}


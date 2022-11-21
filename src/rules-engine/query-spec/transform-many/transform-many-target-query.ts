import { K8sObject } from '../../../types/k8s';
import { ScriptItem } from '../../script-item';
import { BaseTargetQuery, TargetQueryKind } from '../base';

export type TransformerManyFunc = (item: ScriptItem) => K8sObject[];

export class TransformManyTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.TransformMany;

    _inner: BaseTargetQuery;
    _func?: TransformerManyFunc;

    constructor(inner: BaseTargetQuery)
    {
        this._inner = inner;
    }
    
    get kind() {
        return this._kind;
    }

    To(func: TransformerManyFunc)
    {
        this._func = func;
        return this;
    }

}


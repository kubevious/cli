import { ScriptItem } from '../../script-item';
import { BaseTargetQuery, TargetQueryKind } from '../base';

export type FilterFunc = (item: ScriptItem) => boolean;

export class FilterTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.Filter;

    _inner: BaseTargetQuery;
    _func?: FilterFunc;

    constructor(inner: BaseTargetQuery)
    {
        this._inner = inner;
    }
    
    get kind() {
        return this._kind;
    }

    Criteria(func: FilterFunc)
    {
        this._func = func;
        return this;
    }

}


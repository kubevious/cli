import { ScriptItem } from '../../script-item';
import { BaseTargetQuery, TargetQueryKind } from '../base';

export interface ManualQueryFuncArgs
{
    many(query: BaseTargetQuery) : ScriptItem[];
    single(query: BaseTargetQuery) : ScriptItem | null;
    count(query: BaseTargetQuery) : number;
}

export type ManualQueryFunc = (args: ManualQueryFuncArgs) => ScriptItem[];

export class ManualTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.Manual;

    _func: ManualQueryFunc;

    constructor(func: ManualQueryFunc)
    {
        this._func = func;
    }
    
    get kind() {
        return this._kind;
    }

}


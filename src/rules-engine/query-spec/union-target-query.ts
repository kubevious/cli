import { BaseTargetQuery, TargetQueryKind } from './base';

export class UnionTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.Union;

    private _inner: BaseTargetQuery[];

    constructor(...inner: BaseTargetQuery[])
    {
        this._inner = inner;
    }
    
    get kind() {
        return this._kind;
    }
}


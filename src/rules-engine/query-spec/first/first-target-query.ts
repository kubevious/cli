import { BaseTargetQuery, TargetQueryKind } from '../base';

export class FirstTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.Union;

    _inner: BaseTargetQuery[];

    constructor(...inner: BaseTargetQuery[])
    {
        this._inner = inner;
    }
    
    get kind() {
        return this._kind;
    }
}


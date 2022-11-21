import { BaseTargetQuery, TargetQueryKind } from '../base';


export class ShortcutTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.Shortcut;

    _name : string | null = null;

    get kind() {
        return this._kind;
    }

    Shortcut(name: string)
    {
        this._name = name;
        return this;
    }

}
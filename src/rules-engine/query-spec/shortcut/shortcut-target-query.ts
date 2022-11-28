import { BaseTargetQuery, TargetQueryKind } from '../base';


export class ShortcutTargetQuery implements BaseTargetQuery
{
    private _kind = TargetQueryKind.Shortcut;

    _name : string | null = null;
    _args : any[] = [];

    get kind() {
        return this._kind;
    }

    Shortcut(name: string, ...args: any[])
    {
        this._name = name;
        this._args = args ?? [];
        return this;
    }

}
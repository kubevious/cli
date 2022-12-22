import _ from 'the-lodash';
import { ScriptItem } from "../../script-item";

export class NameLookupDict
{
    private _dict : Record<string, ScriptItem> = {};

    get length() {
        return _.keys(this._dict).length;
    }

    add(item: ScriptItem)
    {
        this._dict[item.name ?? ""] = item;
    }

    addMany(items?: ScriptItem[])
    {
        if (items) {
            for(const x of items)
            {
                this.add(x);
            }
        }
    }

    resolve(name: string) : ScriptItem | null
    {
        name = name ?? "";
        return this._dict[name] ?? null;
    }

    contains(name: string) : boolean
    {
        return this.resolve(name) ? true : false;
    }
}

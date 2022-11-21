import { ScriptItem } from "../../script-item";
import { NameLookupDict } from "./dict";

export function newNameLookupDict(items?: ScriptItem[])
{
    const dict = new NameLookupDict();
    dict.addMany(items);
    return dict;
}
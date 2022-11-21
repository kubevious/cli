import _ from 'the-lodash';
import { ScriptItem } from "../../script-item";

export class LabelLookupDict
{
    private _labels : LabelItem[] = []
    private _globalLookup : Record<string, LabelItem[]> = {};

    add(item: ScriptItem, labels: Record<string, string> | undefined)
    {
        labels = labels ?? {};

        const labelItem : LabelItem = {
            item: item,
            labels: labels,
            lookup: {}
        };
        this._labels.push(labelItem);

        for(const key of _.keys(labels))
        {
            const lookupKey = makeLookupKey(key, labels[key]);
            labelItem.lookup[lookupKey] = true;

            if (!this._globalLookup[lookupKey]) {
                this._globalLookup[lookupKey] = [];
            }
            this._globalLookup[lookupKey].push(labelItem);
        }

    }

    resolveSelector(selector: Record<string, string> | undefined) : ScriptItem[]
    {
        selector = selector ?? {};

        const selectorLookupKeys : string[] = []
        for(const key of Object.keys(selector))
        {
            const lookupKey = makeLookupKey(key, selector[key]);
            selectorLookupKeys.push(lookupKey);
        }

        const found: ScriptItem[] = []
        for(const labelItem of this._labels)
        {
            if (this._matchesDict(labelItem, selectorLookupKeys))
            {
                found.push(labelItem.item);
            }
        }
        return found;
    }

    matchesSelector(selector: Record<string, string> | undefined) : boolean
    {
        return this.resolveSelector(selector).length > 0;
    }

    private _matchesDict(labelItem: LabelItem, selectorLookupKeys : string[])
    {
        for(const lookupKey of selectorLookupKeys)
        {
            if (!labelItem.lookup[lookupKey]) {
                return false;
            }
        }
        return true;
    }
}

interface LabelItem
{
    item: ScriptItem,
    labels: Record<string, string>,
    lookup: Record<string, boolean>,
}

function makeLookupKey(key: string, value: string)
{
    return _.stableStringify({ key, value });
}
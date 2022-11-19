import _ from 'the-lodash';
import { K8sManifest } from '../manifests/k8s-manifest';
import { KeyValueDict } from "../rules-engine/query-spec/k8s-target-query";


export class ClientSideFiltering
{
    private _items: K8sManifest[];

    constructor(items: K8sManifest[])
    {
        this._items = items;
    }

    get items() {
        return this._items;
    }

    applyLabelFilter(labelFilters?: KeyValueDict[])
    {
        if (labelFilters && labelFilters.length > 0) {
            this._items = this._items.filter(x => this._doesAnyMatch(labelFilters!, (labelFilter) => {
                for (const key of _.keys(labelFilter)) {
                    const labels = x.config.metadata?.labels ?? {};
                    if (labels[key] != labelFilter[key]) {
                        return false
                    }
                }
                return true;
            }));
        }
    }

    private _doesAnyMatch<T>(matchers: T[], cb: ((value: T) => boolean)) : boolean {
        if (matchers.length == 0) {
            return true;
        }

        for(const matcher of matchers) {
            const isMatch = cb(matcher);
            if (isMatch) {
                return true;
            }
        }
        return false;
    }
}
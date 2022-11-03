import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sManifest } from './manifest-package';
import { K8sObject, makeK8sKeyStr } from '../types/k8s';
import { K8sTargetFilter } from './rules-engine/target/k8s-target-builder';
import { sanitizeDnPath } from '@kubevious/entity-meta';
import { RegistryQueryExecutor } from './rules-engine/query-executor';

export class LocalK8sRegistry implements RegistryQueryExecutor
{
    private _logger: ILogger;

    private _dict : {
        [key: string]: K8sManifest
    } = {};

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('LocalK8sRegistry');
    }

    loadManifest(manifest: K8sManifest)
    {
        const globalKey = makeK8sKeyStr(manifest.config);
        this._dict[globalKey] = manifest;
    }

    query(query: K8sTargetFilter) : K8sObject[]
    {
        let results = _.values(this._dict);

        if (query.isApiVersion) {
            results = results.filter(x => x.id.apiVersion === query.apiVersion);
        } else {
            if (query.apiOrNone) {
                results = results.filter(x => x.id.api === query.apiOrNone);
            } else {
                results = results.filter(x => !x.id.api);
            }

            if (query.version) {
                results = results.filter(x => x.id.version === query.version);
            }
        }

        if (query.kind) {
            results = results.filter(x => x.id.kind === query.kind);
        }

        if (query.namespace) {
            results = results.filter(x => x.id.namespace === query.namespace);
        }

        if (query.nameFilters && query.nameFilters.length > 0) {
            const nameDict = _.makeBoolDict(query.nameFilters);
            results = results.filter(x => x.id.name && nameDict[x.id.name]);
        }

        if (query.labelFilters && query.labelFilters.length > 0) {
            results = results.filter(x => this._doesAnyMatch(query.labelFilters!, (labelFilter) => {
                for (const key of _.keys(labelFilter)) {
                    const labels = x.config.metadata?.labels ?? {};
                    if (labels[key] != labelFilter[key]) {
                        return false
                    }
                }
                return true;
            }));
        }

        return results.map(x => x.config);
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

    async debugOutputToDir(logger: ILogger, relPath: string) : Promise<void>
    {
        for(const key of _.keys(this._dict))
        {
            const filePath = `${relPath}/${sanitizeDnPath(key)}.json`;
            const manifest = this._dict[key];
            await logger.outputFile(filePath, manifest.config);
        }
    }

}
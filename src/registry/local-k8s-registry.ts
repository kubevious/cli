import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { sanitizeDnPath } from '@kubevious/entity-meta';

import { makeK8sKeyStr } from '../types/k8s';
import { K8sTargetFilter } from '../rules-engine/target/k8s-target-builder';
import { RegistryQueryExecutor } from '../rules-engine/query-executor';
import { ClientSideFiltering } from './client-side-filtering';
import { K8sManifest } from '../manifests/k8s-manifest';

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

    query(query: K8sTargetFilter) : K8sManifest[]
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

        const filtering = new ClientSideFiltering(results);
        filtering.applyLabelFilter(query.labelFilters);
        return filtering.items;
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
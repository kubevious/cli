import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { sanitizeDnPath } from '@kubevious/entity-meta';

import { makeK8sKeyStr } from '../types/k8s';
import { RegistryQueryExecutor, RegistryQueryOptions } from '../rules-engine/query-executor';
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

    query(query: RegistryQueryOptions) : K8sManifest[]
    {
        // this._logger.info("[query] query: ", query);

        let results = _.values(this._dict);

        // this._logger.info("[query] 111 count: %s", results.length);

        if (!_.isUndefined(query.apiName))
        {
            if (query.apiName.length === 0)
            {
                results = results.filter(x => !x.id.api);
            }
            else
            {
                results = results.filter(x => x.id.api === query.apiName);
            }
        }

        // this._logger.info("[query] 222 count: %s", results.length);

        if (query.version) {
            results = results.filter(x => x.id.version === query.version);
        }

        // this._logger.info("[query] 333 count: %s", results.length);

        if (query.kind) {
            results = results.filter(x => x.id.kind === query.kind);
        }

        // this._logger.info("[query] 444 count: %s", results.length);

        if (query.namespace) {
            results = results.filter(x => x.id.namespace === query.namespace);
        }

        // this._logger.info("[query] 555 count: %s", results.length);

        if (query.nameFilters && query.nameFilters.length > 0) {
            const nameDict = _.makeBoolDict(query.nameFilters);
            results = results.filter(x => x.id.name && nameDict[x.id.name]);
        }

        // this._logger.info("[query] 666 count: %s", results.length);

        const filtering = new ClientSideFiltering(results);
        filtering.applyLabelFilter(query.labelFilters);

        results = filtering.items;

        // this._logger.info("[query] result count: %s", results.length);

        return results;
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
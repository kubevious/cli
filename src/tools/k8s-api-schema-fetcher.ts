import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';
import { ILogger } from 'the-logger';
import { K8sApiSchemaRegistry } from './k8s-api-schema-registry';

export class K8sApiSchemaFetcher
{
    private _logger: ILogger;

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('K8sApiSchemaFetcher');
        if(!process.env.K8S_API_SCHEMA_DIR) {
            throw new Error(`K8S_API_SCHEMA_DIR not set`);
        }
    }

    async fetchLocal(targetVersion? : string) : Promise<K8sApiSchemaFetcherResult>
    {
        const result : K8sApiSchemaFetcherResult = {
            targetVersion: targetVersion ?? null,
            selectedVersion: null,
            found: false,
            foundExact: true,
            k8sJsonSchema: null,
        }

        const k8sApiRegistry = new K8sApiSchemaRegistry(this._logger);
        k8sApiRegistry.init();

        this._logger.info("targetVersion: ", targetVersion)

        if (targetVersion) {
            const searchResult = k8sApiRegistry.findVersion(targetVersion);
            result.selectedVersion = searchResult.result;
            result.foundExact = searchResult.foundExact;

            this._logger.info("searchResult: ", searchResult)

        } else {
            result.selectedVersion = k8sApiRegistry.findLatestVersion();
            result.foundExact = true;
        }

        if (result.selectedVersion) {
            this._logger.info("XXXXX: %s", result.selectedVersion)
            result.k8sJsonSchema = await k8sApiRegistry.getVersionSchema(result.selectedVersion);
        }

        result.found = result.k8sJsonSchema ? true : false;
        if (!result.found) {
            result.foundExact = false;
        }

        return result;
    }

}

export interface K8sApiSchemaFetcherResult
{
    targetVersion: string | null;
    selectedVersion: string | null;
    found: boolean;
    foundExact: boolean,
    k8sJsonSchema: K8sApiJsonSchema | null;
}

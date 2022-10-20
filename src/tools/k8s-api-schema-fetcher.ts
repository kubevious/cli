import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';
import { ILogger } from 'the-logger';
import { K8sApiSchemaRegistry } from './k8s-api-schema-registry';
import { connectDefaultRemoteCluster, K8sOpenApiSpecToJsonSchemaConverter } from 'k8s-super-client';
import { spinOperation } from '../utils/screen';

export class K8sApiSchemaFetcher
{
    private _logger: ILogger;

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('K8sApiSchemaFetcher');
    }

    async fetchRemote() : Promise<K8sApiSchemaFetcherResult>
    {
        const spinner = spinOperation('Connecting to K8s Cluster...');

        let isConnected = false;
        return connectDefaultRemoteCluster(this._logger.sublogger('k8s'), { skipAPIFetch: true })
            .then(client => {
                spinner.update('Extracting K8s API Schema...')
                this._logger.info("Connected.");
                isConnected = true;

                return client.openAPI.queryClusterVersion()
                    .then(version => {

                        this._logger.info("Cluster version: %s", version);
                        
                        return client.openAPI.queryApiSpecs()
                            .then(k8sOpenApiSpecs => {

                                spinner.complete('K8s API Schema Fetched.');
            
                                const converter = new K8sOpenApiSpecToJsonSchemaConverter(this._logger, k8sOpenApiSpecs);
                                const k8sJsonSchema = converter.convert();

                                const result : K8sApiSchemaFetcherResult = {
                                    success: true,
                                    targetVersion: null,
                                    selectedVersion: version,
                                    found: true,
                                    foundExact: true,
                                    k8sJsonSchema: k8sJsonSchema,
                                };
                                return result;
                            })

                    });
            })
            .catch(reason => {
                const errorMsg = isConnected ? `Error fetching API Schema. ${reason?.message}` : `Could not connect to Kubernetes cluster. ${reason?.message}`;
                spinner.fail(errorMsg);

                const result : K8sApiSchemaFetcherResult = {
                    success: false,
                    error: errorMsg,
                    targetVersion: null,
                    selectedVersion: null,
                    found: false,
                    foundExact: false,
                    k8sJsonSchema: null
                };
                return result;
            })
    }

    async fetchLocal(targetVersion? : string) : Promise<K8sApiSchemaFetcherResult>
    {
        const spinner = spinOperation('Loading K8s API Schema...');

        const result : K8sApiSchemaFetcherResult = {
            success: true,
            targetVersion: targetVersion ?? null,
            selectedVersion: null,
            found: false,
            foundExact: true,
            k8sJsonSchema: null,
        }

        const k8sApiRegistry = new K8sApiSchemaRegistry(this._logger);
        k8sApiRegistry.init();

        this._logger.info("TargetVersion: ", targetVersion)

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
            this._logger.info("SelectedVersion: %s", result.selectedVersion)
            result.k8sJsonSchema = await k8sApiRegistry.getVersionSchema(result.selectedVersion);
        }

        result.found = result.k8sJsonSchema ? true : false;
        if (!result.found) {
            result.success = false;
            result.error = "Could not find Kubernetes API schema.";
            result.foundExact = false;
            spinner.fail("Could not find Kubernetes API schema.");
        } else {
            spinner.complete("Fetched K8s API schema.");
        }

        return result;
    }

}

export interface K8sApiSchemaFetcherResult
{
    success: boolean;
    error?: string;
    targetVersion: string | null;
    selectedVersion: string | null;
    found: boolean;
    foundExact: boolean,
    k8sJsonSchema: K8sApiJsonSchema | null;
}

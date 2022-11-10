import { ILogger } from 'the-logger';
import { connectDefaultRemoteCluster, connectRemoteCluster, KubernetesClient } from 'k8s-super-client';
import { spinOperation } from '../screen/spinner';

export class K8sClusterConnector
{
    private _logger: ILogger;
    private _client: KubernetesClient | null = null;
    private _isUsed = false;
    private _isConnected = false;

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('K8sApiSchemaFetcher');
    }

    get isUsed() {
        return this._isUsed;
    }

    get isConnected() {
        return this._isConnected;
    }

    get client() {
        return this._client;
    }

    async setup(connect: boolean, kubeconfigpath? : string)
    {
        if (!connect) {
            return Promise.resolve();
        }

        this._isUsed = true;

        const spinner = spinOperation('Connecting to K8s Cluster...');

        const skipAPIFetch = false; // true

        return Promise.resolve()
            .then(() => {
                if (kubeconfigpath) {
                    this._logger.info("[fetchRemote] path: %s", kubeconfigpath);
                    return connectRemoteCluster(this._logger.sublogger('k8s'), kubeconfigpath, undefined, { skipAPIFetch: skipAPIFetch })
                } else {
                    return connectDefaultRemoteCluster(this._logger.sublogger('k8s'), { skipAPIFetch: skipAPIFetch })
                }
            })
            .then(client => {
                spinner.complete('Connected to K8s Cluster.')
                this._logger.info("Connected.");
                this._isConnected = true;
                this._client = client;
            })
            .catch(reason => {
                const errorMsg = `Could not connect to Kubernetes cluster. ${reason?.message}`;
                spinner.fail(errorMsg);
            })
    }
}
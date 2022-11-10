import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';
import { K8sManifest, ManifestPackage } from '../manifests/manifest-package';
import { K8sOpenApiResource } from 'k8s-super-client/dist';
import { getJsonSchemaResourceKey } from '../utils/k8s';


export class DefaultNamespaceSetter
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _manifestPackage: ManifestPackage;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema, manifestPackage: ManifestPackage)
    {
        this._logger = logger.sublogger('DefaultNamespaceSetter');
        this._k8sJsonSchema = k8sJsonSchema;
        this._manifestPackage = manifestPackage;
    }

    process()
    {
        for(const manifest of this._manifestPackage.manifests)
        {
            this._processManifest(manifest);
        }
    }

    private _processManifest(manifest: K8sManifest)
    {
        if (manifest.id.namespace) {
            return;
        }

        const apiResource : K8sOpenApiResource = {
            group: manifest.id.api ?? '',
            version: manifest.id.version,
            kind: manifest.id.kind
        }
        const resourceKey = getJsonSchemaResourceKey(apiResource);
        const resourceInfo = this._k8sJsonSchema.resources[resourceKey];

        if (!resourceInfo) {
            return;
        }

        if (resourceInfo.namespaced) {
            manifest.id.namespace = 'default';
            if (!manifest.config.metadata) {
                manifest.config.metadata = {};
            }
            manifest.config.metadata.namespace = manifest.id.namespace;
        }
    }

}
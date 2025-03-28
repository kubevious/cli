import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import { K8sApiJsonSchema } from 'k8s-super-client/dist/open-api/converter/types';
import { ManifestPackage } from '../manifests/manifest-package';

import { LocalK8sRegistry } from './local-k8s-registry';
import { LocalSourceRegistry } from './local-source-registry';
import { K8sManifest } from '../manifests/k8s-manifest';

interface LocalRegistryPopulatorParams
{
    allowDuplicates: boolean;
}

export class LocalRegistryPopulator
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _manifestPackage: ManifestPackage;
    private _options: LocalRegistryPopulatorParams;

    private _localSourceRegistry: LocalSourceRegistry;
    private _localK8sRegistry : LocalK8sRegistry;

    constructor(logger: ILogger,
                k8sJsonSchema: K8sApiJsonSchema,
                manifestPackage: ManifestPackage,
                options: LocalRegistryPopulatorParams)
    {
        this._logger = logger.sublogger('LocalRegistryPopulator');
        this._k8sJsonSchema = k8sJsonSchema;
        this._manifestPackage = manifestPackage;
        this._options = options;

        this._localSourceRegistry = new LocalSourceRegistry(logger, manifestPackage);
        this._localK8sRegistry = new LocalK8sRegistry(logger);
    }

    get localK8sRegistry() {
        return this._localK8sRegistry;
    }

    process()
    {
        for(const manifest of this._manifestPackage.manifests)
        {
            this._processManifest(manifest);
        }

        if (this._options.allowDuplicates)
        {
            this._localSourceRegistry.cleanupDuplicates();
        }
        else
        {
            this._localSourceRegistry.enforceDuplicateCheck();
        }

        for(const manifest of this._manifestPackage.manifests)
        {
            this._localK8sRegistry.loadManifest(manifest);
        }
    }

    private _processManifest(manifest: K8sManifest)
    {
        this._localSourceRegistry.add(manifest);
    }

}
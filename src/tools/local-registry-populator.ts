import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import { makeDn, RnInfo, NodeKind, PropsKind, PropsId } from '@kubevious/entity-meta';
import { K8sApiResourceStatusConfig, K8sApiResourceStatus } from '@kubevious/entity-meta';

import { K8sApiJsonSchema, K8sApiResourceInfo } from 'k8s-super-client/dist/open-api/converter/types';
import { K8sManifest, ManifestPackage } from './manifest-package';
import { LocalSourceRegistry } from './local-source-registry';
import { LocalRegistryAccessor } from './local-registry-accessor';

import { K8sObjectId } from '../types/k8s';
import { K8sOpenApiResource } from 'k8s-super-client/dist';
import { LocalK8sRegistry } from './local-k8s-registry';

export class LocalRegistryPopulator
{
    private _logger: ILogger;
    private _k8sJsonSchema : K8sApiJsonSchema;
    private _manifestPackage: ManifestPackage;

    private _localSourceRegistry: LocalSourceRegistry;
    private _localRegistryAccessor: LocalRegistryAccessor;
    private _localK8sRegistry : LocalK8sRegistry;

    constructor(logger: ILogger, k8sJsonSchema : K8sApiJsonSchema, manifestPackage: ManifestPackage)
    {
        this._logger = logger.sublogger('LocalRegistryPopulator');
        this._k8sJsonSchema = k8sJsonSchema;
        this._manifestPackage = manifestPackage;

        this._localSourceRegistry = new LocalSourceRegistry(logger, manifestPackage);
        this._localRegistryAccessor = new LocalRegistryAccessor(logger);
        this._localK8sRegistry = new LocalK8sRegistry(logger);
    }

    get localK8sRegistry() {
        return this._localK8sRegistry;
    }

    get localRegistryAccessor() {
        return this._localRegistryAccessor;
    }

    process()
    {
        for(const manifest of this._manifestPackage.manifests)
        {
            this._localK8sRegistry.loadManifest(manifest);
        }

        for(const manifest of this._manifestPackage.manifests)
        {
            this._processManifest(manifest);
        }
        this._localSourceRegistry.validateDuplicates();

        this._produceLocalRegistry();
    }

    private _processManifest(manifest: K8sManifest)
    {
        this._localSourceRegistry.add(manifest);
    }

    private _produceLocalRegistry()
    {
        for(const manifest of this._localSourceRegistry.manifests)
        {
            this._loadManifest(manifest);
        }
        this._produceInfraAPI();
    }   

    private _loadManifest(manifest: K8sManifest)
    {
        const dn = this.makeManifestDn(manifest.id);
        this._logger.info("[_loadManifest] %s", dn);
        this._localRegistryAccessor.registerNode(dn);
        this._localRegistryAccessor.registerProperties(dn, {
            kind: PropsKind.yaml,
            id: PropsId.config,
            config: manifest.config
        });
    }

    private makeManifestDn(id: K8sObjectId)
    {
        const parts : RnInfo[] = [
            { kind: NodeKind.root },
            { kind: NodeKind.k8s }
        ];

        if (id.namespace) {
            parts.push({ kind: NodeKind.ns, name: id.namespace })
        } else {
            parts.push({ kind: NodeKind.cluster })
        }

        if (id.api) {
            parts.push({ kind: NodeKind.api, name: id.api })
        }

        parts.push({ kind: NodeKind.version, name: id.version })
        parts.push({ kind: NodeKind.kind, name: id.kind })
        parts.push({ kind: NodeKind.resource, name: id.name })
        
        return makeDn(parts);
    }

    private _produceInfraAPI()
    {
        const parts : RnInfo[] = [
            { kind: NodeKind.root },
            { kind: NodeKind.infra },
            { kind: NodeKind.k8s }
        ];
        const dn = makeDn(parts);

        this._localRegistryAccessor.registerNode(dn);
        this._localRegistryAccessor.registerProperties(dn, {
            kind: PropsKind.yaml,
            id: PropsId.config,
            config: this._produceK8sApiResourceStatusConfig()
        });

    }

    private _produceK8sApiResourceStatusConfig() : K8sApiResourceStatusConfig
    {
        const resources : K8sApiResourceStatus[] = [];

        for(const key of _.keys(this._k8sJsonSchema.resources))
        {
            const apiResource = JSON.parse(key) as K8sOpenApiResource;
            const resourceInfo = this._k8sJsonSchema.resources[key];
            const resourceStatus: K8sApiResourceStatus = {
                apiVersion: apiResource.group ? `${apiResource.group}/${apiResource.version}` : apiResource.version,
                apiName: apiResource.group || null,
                version: apiResource.version,
                kindName: apiResource.kind,
                isNamespaced: resourceInfo.namespaced,
                verbs: ['get']
            }
            resources.push(resourceStatus);
        }

        const config : K8sApiResourceStatusConfig = {
            config: {
                resources: resources
            }
        }

        return config;
    }
}
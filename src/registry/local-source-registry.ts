import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { K8sManifest } from '../manifests/k8s-manifest';
import { ManifestPackage } from '../manifests/manifest-package';

export class LocalSourceRegistry
{
    private _logger: ILogger;
    private _multiFlatDict : Record<string, K8sManifest[]> = {};
    private _flatDict : Record<string, K8sManifest> = {};
    private _manifestPackage: ManifestPackage;

    constructor(logger: ILogger, manifestPackage: ManifestPackage)
    {
        this._logger = logger.sublogger('LocalSourceRegistry');
        this._manifestPackage = manifestPackage;
    }

    get manifests() {
        return _.values(this._flatDict);
    }

    add(manifest: K8sManifest)
    {
        const key = _.stableStringify(manifest.id);
        this._flatDict[key] = manifest;
        if (!this._multiFlatDict[key]) {
            this._multiFlatDict[key] = [];
        }
        this._multiFlatDict[key].push(manifest);
    }

    validateDuplicates()
    {
        for(const key of _.keys(this._multiFlatDict))
        {
            const manifests = this._multiFlatDict[key];
            if (manifests.length > 1)
            {
                for(const manifest of manifests)
                {
                    const message = 'Manifest is defined in multiple sources.';
                    this._manifestPackage.manifestError(manifest, message);
                }
            }
        }
    }

}

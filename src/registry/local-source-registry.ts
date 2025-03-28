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

    extractDuplicateGroups() : K8sManifest[][]
    {
        const duplicateGroups : K8sManifest[][] = []
        for(const key of _.keys(this._multiFlatDict))
        {
            const manifests = this._multiFlatDict[key];
            if (manifests.length > 1)
            {
                duplicateGroups.push(manifests);
            }
        }
        return duplicateGroups;
    }

    enforceDuplicateCheck()
    {
        const duplicateGroups = this.extractDuplicateGroups();
        for(const manifests of duplicateGroups)
        {
            for(const manifest of manifests)
            {
                const message = 'Manifest is defined in multiple sources.';
                manifest.reportError(message);
            }
        }
    }

    cleanupDuplicates()
    {
        const duplicateGroups = this.extractDuplicateGroups();
        for(const manifests of duplicateGroups)
        {
            for(const manifest of _.dropRight(manifests, 1))
            {
                const message = 'Manifest is duplicate and is skipped.';
                manifest.reportWarning(message);
                // manifest.isSkipped = true;
            }

            {
                const message = 'Duplicate manifests found.';
                _.last(manifests)!.reportWarning(message);
            }
        }
    }
}

import { K8sManifest } from "../../manifests/k8s-manifest";
import { BaseObject } from "../../types/base-object";
import { ManifestResult } from "../../types/manifest-result";

export class ManifestViolation extends BaseObject
{ 
    private _manifest: K8sManifest;

    constructor(manifest: K8sManifest)
    {
        super();
        this._manifest = manifest;
    }

    get manifest() {
        return this._manifest;
    }

    exportResult() : ManifestResult
    {
        const result : ManifestResult = {
            ...this.manifest.id,
            ...this.extractBaseResult(),
            sources: this.manifest.exportSourcesResult(),
        };

        return result;
    }
}
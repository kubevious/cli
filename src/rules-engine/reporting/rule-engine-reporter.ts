import { ILogger } from "the-logger";
import { RuleObject } from "../registry/types";
import { ManifestPackage } from "../../manifests/manifest-package";
import { K8sManifest } from "../../manifests/k8s-manifest";

export class RuleEngineReporter
{
    private _logger: ILogger;
    private _manifestPackage : ManifestPackage;
    
    constructor(logger: ILogger, manifestPackage : ManifestPackage)
    {
        this._logger = logger.sublogger('RuleEngineReporter');
        this._manifestPackage = manifestPackage;
    }

    get manifestPackage() {
        return this._manifestPackage;
    }

    reportError(rule: RuleObject, manifest: K8sManifest, msg: string)
    {
        this._manifestPackage.manifestError(manifest, msg);
    }

    reportWarning(rule: RuleObject, manifest: K8sManifest, msg: string)
    {
        this._manifestPackage.manifestWarning(manifest, msg);
    }

}
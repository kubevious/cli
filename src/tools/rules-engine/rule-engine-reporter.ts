import { ILogger } from "the-logger";
import { RuleObject } from "./types/rules";
import { K8sManifest, ManifestPackage } from "../manifest-package";

export class RuleEngineReporter
{
    private _logger: ILogger;
    private _manifestPackage : ManifestPackage;
    
    constructor(logger: ILogger, manifestPackage : ManifestPackage)
    {
        this._logger = logger.sublogger('RuleEngineReporter');
        this._manifestPackage = manifestPackage;
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
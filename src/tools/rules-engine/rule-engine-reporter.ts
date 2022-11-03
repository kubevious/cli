import { ILogger } from "the-logger";
import { RuleObject } from "../../types/rules";
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

    reportScriptErrors(rule: RuleObject, source: string, messages: string[])
    {
        for(const x of messages)
        {
            const line = `Error with rule ${rule.name} ${source}. ${x}`;
            this._reportRuleError(rule, line);
        }
    }

    reportError(rule: RuleObject, manifest: K8sManifest, msg: string)
    {
        const manifestMsg = `Rule ${rule.name} violated. ${msg}.`;
        this._manifestPackage.manifestError(manifest, manifestMsg);
    }

    reportWarning(rule: RuleObject, manifest: K8sManifest, msg: string)
    {
        const manifestMsg = `Rule ${rule.name} warned. ${msg}.`;
        this._manifestPackage.manifestWarning(manifest, manifestMsg);
    }

    private _reportRuleError(rule: RuleObject, msg: string)
    {
        this._logger.info("[_reportRuleError] %s -> %s", rule.name, msg);
    }
}
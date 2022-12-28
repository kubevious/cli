import _ from 'the-lodash';
import { Promise as MyPromise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleApplicationScope, RuleObject } from '../registry/types';
import { ValidationProcessorResult } from '../compiler/validator/processor';
import { ScriptItem } from '../script-item';
import { RuleOverrideValues } from '../spec/rule-spec';
import { K8sManifest } from '../../manifests/k8s-manifest';
import { ManifestViolation } from './manifest-violation';
import { CacheRunResult, RuleRuntime } from './rule-runtime';

export class RuleExecutionRuntime
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;
    private _manifest: K8sManifest;

    private _application: RuleApplicationScope;
    private _values: RuleOverrideValues;
    
    private _ruleRuntime: RuleRuntime;
    

    constructor(logger: ILogger,
                manifest: K8sManifest,
                ruleObject: RuleObject,
                ruleRuntime: RuleRuntime,
                application: RuleApplicationScope,
                values: RuleOverrideValues)
    {
        this._logger = logger.sublogger('RuleExecutionRuntime');
        this._manifest = manifest;
        this._ruleObject = ruleObject;
        this._ruleRuntime = ruleRuntime;
        this._application = application;
        this._values = values;
    }

    get compiler() {
        return this._ruleRuntime.compiler!;
    }

    get rule() {
        return this._ruleRuntime.rule;
    }

    get application() {
        return this._application;
    }

    get isCompiled() {
        return this._ruleRuntime.isCompiled;
    }

    get hasRuntimeErrors() {
        return this._ruleRuntime.hasRuntimeErrors;
    }

    get ruleEngineReporter() {
        return this._ruleRuntime.ruleEngineReporter;
    }

    async execute()
    {
        this._logger.info('[execute] %s :: %s :: %s...', this._ruleObject.kind, this._ruleObject.namespace, this._ruleObject.name);

        if (!this.compiler) {
            return;
        }

        if (this.compiler.isCompiled) {
            const results = await this._processTarget();
            this._logger.info('[execute] Targets Count: %s', results.length);

            const cacheResult = await this._ruleRuntime.processGlobalCache(this._values)
            if (!cacheResult.success) {
                return;
            }

            await MyPromise.serial(results, x => MyPromise.resolve(this._processItem(x, cacheResult)));
        }

        if (!this.isCompiled  || this.hasRuntimeErrors)
        {
            if (!(this._manifest.errorsWithRule ?? false))
            {
                this._manifest.errorsWithRule = true;
                this._manifest.reportError("Failed to compile the rule.");
            }
        }
    }

    private async _processTarget() : Promise<ScriptItem[]>
    {
        try
        {
            return await this.compiler.targetProcessor.execute(this._application, this._values)
        }
        catch(reason: any)
        {
            this._logger.error("Failed to execute the rule %s", this._ruleObject.name, reason);
            this.compiler.reportScriptErrors('rule', [reason.message]);
            return [];
        }
    }

    private async _processItem(item: ScriptItem, globalCacheResult: CacheRunResult)
    {
        this._logger.info("[_processItem] %s :: %s", item.apiVersion, item.kind);

        const cacheResult = await this._ruleRuntime.processLocalCache(item, this._values)
        if (!cacheResult.success) {
            return;
        }
        return this._processValidation(item, globalCacheResult, cacheResult);
    }

    private async _processValidation(item: ScriptItem, globalCacheResult: CacheRunResult, localCacheResult: CacheRunResult)
    {
        this._logger.info("[_processValidation] %s :: %s", item.apiVersion, item.kind);

        const result = await this.compiler.validationProcessor.execute(item,
                                                                       globalCacheResult.cache,
                                                                       localCacheResult.cache,
                                                                       this._values)
        this._logger.debug("[_processValidation]  result: ", result);

        if (result.success)
        {
            this._processValidationResult(item.manifest, result);
        }
        else
        {
            if (result.messages && (result.messages.length > 0))
            {
                this.compiler.reportScriptErrors('rule', result.messages);
            }
            else
            {
                this.compiler.reportScriptErrors('rule', 
                    ['Unknown error executing the rule.']);
            }
        }
    }

    private _processValidationResult(manifest: K8sManifest, result: ValidationProcessorResult)
    {
        manifest.rules.processed = true;

        if ((_.keys(result.validation.errorMsgs).length + _.keys(result.validation.warnMsgs).length) > 0)
        {
            if (_.keys(result.validation.errorMsgs).length > 0) {
                manifest.rules.errors = true;
            }

            if (_.keys(result.validation.warnMsgs).length > 0) {
                manifest.rules.warnings = true;
            }

            const manifestViolations = new ManifestViolation(manifest);
            for(const error of _.keys(result.validation.errorMsgs))
            {
                this._reportError(manifest, error);
                manifestViolations.reportError(error);
            }

            for(const warn of _.keys(result.validation.warnMsgs))
            {
                this._reportWarning(manifest, warn);
                manifestViolations.reportWarning(warn);
            }

            this._ruleRuntime.violations.push(manifestViolations);
        }
        else
        {
            this._ruleRuntime.passed.push(manifest);
        }
    }

    private _reportError(manifest: K8sManifest, msg: string)
    {
        const manifestMsg = `Rule ${this._ruleObject.name} violated. ${msg}.`;
        this.ruleEngineReporter.reportError(this._ruleObject, manifest, manifestMsg);
    }

    private _reportWarning(manifest: K8sManifest, msg: string)
    {
        const manifestMsg = `Rule ${this._ruleObject.name} warned. ${msg}.`;
        this.ruleEngineReporter.reportWarning(this._ruleObject, manifest, manifestMsg);
    }
}



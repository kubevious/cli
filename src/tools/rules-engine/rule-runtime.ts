import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleApplicationScope, RuleObject } from './types/rules';
import { ValidationProcessorResult } from './validator/processor';
import { ScriptItem } from './script-item';
import { RuleEngineReporter } from './rule-engine-reporter';
import { K8sManifest } from '../manifest-package';
import { RuleCompiler } from './rule-compiler';
import { RuleOverrideValues } from './spec/rule-spec';

export class RuleRuntime
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;

    private _compiler: RuleCompiler;
    private _application: RuleApplicationScope;
    private _values: RuleOverrideValues;
    private _ruleEngineReporter : RuleEngineReporter;
    
    private _violations : ManifestViolations[] = [];
    private _passed : K8sManifest[] = [];

    constructor(logger: ILogger,
                ruleObject: RuleObject,
                ruleEngineReporter: RuleEngineReporter,
                compiler: RuleCompiler,
                application: RuleApplicationScope,
                values: RuleOverrideValues)
    {
        this._logger = logger.sublogger('RuleObject');
        this._ruleObject = ruleObject;
        this._ruleEngineReporter = ruleEngineReporter;
        this._compiler = compiler;
        this._application = application;
        this._values = values;
    }

    get rule() {
        return this._compiler.rule;
    }

    get isCompiled() {
        return this._compiler.isCompiled;
    }

    get hasRuntimeErrors() {
        return this._compiler.hasRuntimeErrors;
    }

    get ruleErrors() {
        return this._compiler.ruleErrors;
    }

    get violations() {
        return this._violations;
    }

    get passed() {
        return this._passed;
    }

    execute()
    {
        if (!this._compiler.isCompiled) {
            return;
        }
        
        return Promise.resolve()
            .then(() => {
                return this._processTarget()
                    .then(results => {
                        return Promise.serial(results, x => this._processValidation(x));
                    });
            })
    }

    private _processTarget() : Promise<ScriptItem[]>
    {
        return Promise.resolve()
            .then(() => {
                return this._compiler.targetProcessor.execute(this._application, this._values)
            })
            .catch(reason => {
                this._logger.error("Failed to execute the rule %s", this._ruleObject.name, reason);
                this._compiler.reportScriptErrors('rule', reason.message);
                return [];
            });
    }

    private _processValidation(item: ScriptItem)
    {
        this._logger.info("[_processValidation] %s :: %s", item.apiVersion, item.kind);
        return Promise.resolve()
            .then(() => {
                return this._compiler.validationProcessor.execute(item, this._values)
                    .then(result => {
                        this._logger.info("[_processValidation]  result: ", result);

                        if (result.success)
                        {
                            this._processValidationResult(item.manifest, result);
                        }
                        else
                        {
                            if (result.messages && (result.messages.length > 0))
                            {
                                this._compiler.reportScriptErrors('rule', result.messages);
                            }
                            else
                            {
                                this._compiler.reportScriptErrors('rule', 
                                    ['Unknown error executing the rule.']);
                            }
                        }
                    });
            })
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

            const manifestViolations : ManifestViolations = {
                manifest: manifest,
                hasErrors: (_.keys(result.validation.errorMsgs).length > 0),
                hasWarnings: (_.keys(result.validation.warnMsgs).length > 0),
            }

            for(const error of _.keys(result.validation.errorMsgs))
            {
                this._reportError(manifest, error);
                if (!manifestViolations.errors) {
                    manifestViolations.errors = [];
                }
                manifestViolations.errors.push(error);
            }

            for(const warn of _.keys(result.validation.warnMsgs))
            {
                this._reportWarning(manifest, warn);
                if (!manifestViolations.warnings) {
                    manifestViolations.warnings = [];
                }
                manifestViolations.warnings.push(warn);
            }

            this._violations.push(manifestViolations);
        }
        else
        {
            this._passed.push(manifest);
        }
    }

    private _reportError(manifest: K8sManifest, msg: string)
    {
        const manifestMsg = `Rule ${this._ruleObject.name} violated. ${msg}.`;
        this._ruleEngineReporter.reportError(this._ruleObject, manifest, manifestMsg);
    }

    private _reportWarning(manifest: K8sManifest, msg: string)
    {
        const manifestMsg = `Rule ${this._ruleObject.name} warned. ${msg}.`;
        this._ruleEngineReporter.reportWarning(this._ruleObject, manifest, manifestMsg);
    }
}

export interface ManifestViolations
{
    manifest: K8sManifest;
    hasErrors: boolean;
    hasWarnings: boolean;
    errors?: string[];
    warnings?: string[];
}

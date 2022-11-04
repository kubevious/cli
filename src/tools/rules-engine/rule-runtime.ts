import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../../types/rules';
import { TargetProcessor } from './target/processor';
import { ExecutionContext } from './execution-context';
import { ValidationProcessor } from './validator/processor';
import { ScriptItem } from './script-item';
import { RuleEngineReporter } from './rule-engine-reporter';
import { K8sManifest } from '../manifest-package';

export class RuleRuntime
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;

    private _targetProcessor?: TargetProcessor;
    private _validationProcessor?: ValidationProcessor;

    private _executionContext : ExecutionContext;
    private _ruleEngineReporter : RuleEngineReporter;
    
    private _isCompiled = false;
    private _isHasErrors = false;
    private _ruleErrors : RuleError[] = [];
    private _violations : ManifestViolations[] = [];

    constructor(logger: ILogger,
                ruleObject: RuleObject,
                executionContext: ExecutionContext,
                ruleEngineReporter: RuleEngineReporter)
    {
        this._logger = logger.sublogger('RuleObject');
        this._ruleObject = ruleObject;
        this._executionContext = executionContext;
        this._ruleEngineReporter = ruleEngineReporter;
    }

    get rule() {
        return this._ruleObject;
    }

    get isCompiled() {
        return this._isCompiled;
    }

    get isHasErrors() {
        return this._isHasErrors;
    }

    get ruleErrors() {
        return this._ruleErrors;
    }

    get violations() {
        return this._violations;
    }

    init()
    {
        this._logger.info("[init] %s", this._ruleObject.name);

        this._logger.info("[init] TARGET: %s", this._ruleObject.target);

        this._targetProcessor = new TargetProcessor(this._ruleObject.target, this._executionContext);
        this._validationProcessor = new ValidationProcessor(this._ruleObject.script, this._executionContext);

        this._isCompiled = true;

        return Promise.resolve()
            .then(() => {
                return this._targetProcessor!.prepare().then((result) => {
                    this._logger.info("[init] _targetProcessor prepare: ", result);
                    if (!result.success) {
                        this._isCompiled = false;
                        this._reportScriptErrors('target', result.messages);
                    }
                })
            })
            .then(() => {
                return this._validationProcessor!.prepare().then((result) => {
                    this._logger.info("[init] _validationProcessor prepare: ", result);
                    // console.log("[RULE-PROCESSOR] TARGETS PREPARE RESULT: ", result)
                    // this._acceptScriptErrors('target', result)
                    if (!result.success) {
                        this._isCompiled = false;
                        this._reportScriptErrors('script', result.messages);
                    }
                })
            })
            ;
    }

    execute()
    {
        if (!this._isCompiled) {
            return;
        }
        
        return Promise.resolve()
            .then(() => {
                return this._targetProcessor!.execute()
                    .then(results => {
                        return Promise.serial(results, x => this._processValidation(x));
                    });
            })
    }

    private _processValidation(item: ScriptItem)
    {
        this._logger.info("[_processValidation] %s :: %s", item.apiVersion, item.kind);
        return Promise.resolve()
            .then(() => {
                return this._validationProcessor!.execute(item)
                    .then(result => {
                        this._logger.info("[_processValidation]  result: ", result);

                        if (result.success)
                        {
                            if (result.validation)
                            {
                                if ((_.keys(result.validation.errorMsgs).length + _.keys(result.validation.warnMsgs).length) > 0)
                                {
                                    const manifestViolations : ManifestViolations = {
                                        manifest: item.manifest
                                    }

                                    for(const error of _.keys(result.validation.errorMsgs))
                                    {
                                        this._reportError(item.manifest, error);
                                        if (!manifestViolations.errors) {
                                            manifestViolations.errors = [];
                                        }
                                        manifestViolations.errors.push(error);
                                    }
                                    for(const warn of _.keys(result.validation.warnMsgs))
                                    {
                                        this._reportWarning(item.manifest, warn);
                                        if (!manifestViolations.warnings) {
                                            manifestViolations.warnings = [];
                                        }
                                        manifestViolations.warnings.push(warn);
                                    }

                                    this._violations.push(manifestViolations);
                                }
                            }
                        }
                        else
                        {
                            if (result.messages && (result.messages.length > 0))
                            {
                                this._reportScriptErrors('rule', result.messages);
                            }
                            else
                            {
                                this._reportScriptErrors('rule', 
                                    ['Unknown error executing the rule.']);
                            }
                        }
                    });
            })

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

    private _reportScriptErrors(source: string, messages: string[])
    {
        this._isHasErrors = true;

        for(const x of messages)
        {
            const line = `Error with rule ${source}. ${x}`;
            this._ruleErrors.push({
                source: source,
                msg: line
            });

            this._logger.info("[_reportRuleError] %s", line);
        }
    }
}

export interface RuleError
{
    source: string;
    msg: string;
}


export interface ManifestViolations
{
    manifest: K8sManifest;
    errors?: string[];
    warnings?: string[];
}

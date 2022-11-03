import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../../types/rules';
import { TargetProcessor } from './target/processor';
import { ExecutionContext } from './execution-context';
import { ValidationProcessor } from './validator/processor';
import { ScriptItem } from './script-item';
import { RuleEngineReporter } from './rule-engine-reporter';

export class RuleRuntime
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;

    private _isCompiled = false;
    private _targetProcessor?: TargetProcessor;
    private _validationProcessor?: ValidationProcessor;

    private _executionContext : ExecutionContext;
    private _ruleEngineReporter : RuleEngineReporter;
    
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
                        this._ruleEngineReporter.reportScriptErrors(this._ruleObject, 'target', result.messages);
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
                        this._ruleEngineReporter.reportScriptErrors(this._ruleObject, 'script', result.messages);
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
                                for(const error of _.keys(result.validation.errorMsgs))
                                {
                                    this._ruleEngineReporter.reportError(this._ruleObject, item.manifest, error);
                                }
                                for(const warn of _.keys(result.validation.warnMsgs))
                                {
                                    this._ruleEngineReporter.reportWarning(this._ruleObject, item.manifest, warn);
                                }
                            }
                        }
                        else
                        {
                            if (result.messages && (result.messages.length > 0))
                            {
                                this._ruleEngineReporter.reportScriptErrors(this._ruleObject, 'rule', result.messages);
                            }
                            else
                            {
                                this._ruleEngineReporter.reportScriptErrors(this._ruleObject, 'rule', 
                                    ['Unknown error executing the rule.']);
                            }
                        }
                    });
            })

    }
}



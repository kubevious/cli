import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../types/rules';
import { TargetProcessor } from './rules-engine/target/processor';
import { ExecutionContext } from './rules-engine/execution-context';
import { ValidationProcessor } from './rules-engine/validator/processor';
import { ScriptItem } from './rules-engine/script-item';

export class RuleRuntime
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;

    private _targetProcessor?: TargetProcessor;
    private _validationProcessor?: ValidationProcessor;

    private _executionContext : ExecutionContext;
    
    constructor(logger: ILogger, ruleObject: RuleObject, executionContext : ExecutionContext)
    {
        this._logger = logger.sublogger('RuleObject');
        this._ruleObject = ruleObject;

        this._executionContext = executionContext;
    }

    init()
    {
        this._logger.info("[init] %s", this._ruleObject.name);

        this._logger.info("[init] TARGET: %s", this._ruleObject.target);

        this._targetProcessor = new TargetProcessor(this._ruleObject.target, this._executionContext);
        this._validationProcessor = new ValidationProcessor(this._ruleObject.script, this._executionContext);

        return Promise.resolve()
            .then(() => {
                return this._targetProcessor!.prepare().then((result) => {
                    this._logger.info("[init] _targetProcessor prepare: ", result);
                    // console.log("[RULE-PROCESSOR] TARGETS PREPARE RESULT: ", result)
                    // this._acceptScriptErrors('target', result)
                })
            })
            .then(() => {
                return this._validationProcessor!.prepare().then((result) => {
                    this._logger.info("[init] _validationProcessor prepare: ", result);
                    // console.log("[RULE-PROCESSOR] TARGETS PREPARE RESULT: ", result)
                    // this._acceptScriptErrors('target', result)
                })
            })
    }

    execute()
    {
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
                                    const msg = `Rule ${"XXXXX"} failed. ${error}.`;
                                    this._executionContext.manifestPackage.manifestError(item.manifest, msg);
                                }
                                for(const warn of _.keys(result.validation.warnMsgs))
                                {
                                    const msg = `Rule ${"XXXXX"} warned. ${warn}.`;
                                    this._executionContext.manifestPackage.manifestWarning(item.manifest, msg);
                                }
                            }
                        }
                    });
            })

    }
}



import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../types/rules';
import { TargetProcessor } from '@kubevious/kubik/dist/processors/target/processor';
import { ValidationProcessor } from '@kubevious/kubik/dist/processors/validator/processor';
import { ExecutionState } from '@kubevious/kubik/dist/processors/execution-state';

export class RuleRuntime
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;

    private _targetProcessor?: TargetProcessor;
    private _validationProcessor?: ValidationProcessor;

    private _executionState? : ExecutionState;
    
    constructor(logger: ILogger, ruleObject: RuleObject)
    {
        this._logger = logger.sublogger('RuleObject');
        this._ruleObject = ruleObject;

        // this._executionState = new ExecutionState()

    }

    init()
    {
        this._logger.info("[init] %s", this._ruleObject.name);

        // this._targetProcessor = new TargetProcessor(this._ruleObject.target, this._executionState)

        return Promise.resolve()
            .then(() => {
                // return this._targetProcessor.prepare().then((result) => {
                //     // console.log("[RULE-PROCESSOR] TARGETS PREPARE RESULT: ", result)
                //     this._acceptScriptErrors('target', result)
                // })
            })
    }
}



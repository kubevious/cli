import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from './types/rules';
import { TargetProcessor } from './target/processor';
import { ExecutionContext } from './execution-context';
import { ValidationProcessor } from './validator/processor';

export class RuleCompiler
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;

    private _executionContext : ExecutionContext;

    private _targetProcessor: TargetProcessor;
    private _validationProcessor: ValidationProcessor;

    private _isCompiled = false;
    private _isHasErrors = false;
    private _ruleErrors : RuleError[] = [];

    constructor(logger: ILogger,
                ruleObject: RuleObject,
                executionContext: ExecutionContext)
    {
        this._logger = logger.sublogger('RuleCompiler');
        this._ruleObject = ruleObject;
        this._executionContext = executionContext;

        this._targetProcessor = new TargetProcessor(this._ruleObject.target, this._executionContext);
        this._validationProcessor = new ValidationProcessor(this._ruleObject.script, this._executionContext);
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

    get targetProcessor() {
        return this._targetProcessor;
    }

    get validationProcessor() {
        return this._validationProcessor;
    }

    compile()
    {
        this._logger.info("[init] %s", this._ruleObject.name);

        this._logger.info("[init] TARGET: %s", this._ruleObject.target);


        this._isCompiled = true;

        return Promise.resolve()
            .then(() => {
                return this._targetProcessor.prepare().then((result) => {
                    this._logger.info("[init] _targetProcessor prepare: ", result);
                    if (!result.success) {
                        this._isCompiled = false;
                        this.reportScriptErrors('target', result.messages);
                    }
                })
            })
            .then(() => {
                return this._validationProcessor.prepare().then((result) => {
                    this._logger.info("[init] _validationProcessor prepare: ", result);
                    // console.log("[RULE-PROCESSOR] TARGETS PREPARE RESULT: ", result)
                    // this._acceptScriptErrors('target', result)
                    if (!result.success) {
                        this._isCompiled = false;
                        this.reportScriptErrors('script', result.messages);
                    }
                })
            })
            ;
    }

    reportScriptErrors(source: string, messages: string[])
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

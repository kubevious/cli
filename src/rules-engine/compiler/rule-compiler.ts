import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../registry/types';
import { TargetProcessor } from './target/processor';
import { CacheProcessor } from './cache/processor';
import { ValidationProcessor } from './validator/processor';
import { ExecutionContext } from '../execution/execution-context';

export class RuleCompiler
{
    private _logger: ILogger;
    private _ruleObject: RuleObject;


    private _targetProcessor: TargetProcessor;
    private _validationProcessor: ValidationProcessor;
    private _globalCacheProcessor?: CacheProcessor;
    private _localCacheProcessor?: CacheProcessor;

    private _isCompiled = false;
    private _hasRuntimeErrors = false;
    private _ruleErrors : RuleError[] = [];

    constructor(logger: ILogger,
                ruleObject: RuleObject,
                targetExecutionContext: ExecutionContext,
                validatorExecutionContext: ExecutionContext)
    {
        this._logger = logger.sublogger('RuleCompiler');
        this._ruleObject = ruleObject;

        this._targetProcessor = new TargetProcessor(this._ruleObject.target, targetExecutionContext);
        this._validationProcessor = new ValidationProcessor(this._ruleObject.script, validatorExecutionContext);

        if (this._ruleObject.globalCache) {
            this._globalCacheProcessor = new CacheProcessor(this._ruleObject.globalCache, validatorExecutionContext);
        }
        if (this._ruleObject.cache) {
            this._localCacheProcessor = new CacheProcessor(this._ruleObject.cache, validatorExecutionContext);
        }
    }

    get rule() {
        return this._ruleObject;
    }

    get isCompiled() {
        return this._isCompiled;
    }

    get hasRuntimeErrors() {
        return this._hasRuntimeErrors;
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

    get globalCacheProcessor() {
        return this._globalCacheProcessor;
    }

    get localCacheProcessor() {
        return this._localCacheProcessor;
    }

    compile()
    {
        this._logger.info("[compile] %s", this._ruleObject.name);

        this._isCompiled = true;

        return Promise.resolve()
            .then(() => {
                return this._targetProcessor.prepare().then((result) => {
                    this._logger.verbose("[compile] _targetProcessor prepare: ", result);
                    if (!result.success) {
                        this._isCompiled = false;
                        this.reportScriptErrors('target', result.messages);
                    }
                })
            })
            .then(() => {
                return this._validationProcessor.prepare().then((result) => {
                    this._logger.verbose("[compile] _validationProcessor prepare: ", result);
                    if (!result.success) {
                        this._isCompiled = false;
                        this.reportScriptErrors('script', result.messages);
                    }
                })
            })
            .then(() => {
                if (!this._globalCacheProcessor) {
                    return;
                }

                return this._globalCacheProcessor!.prepare().then((result) => {
                    this._logger.verbose("[compile] _globalCacheProcessor prepare: ", result);
                    if (!result.success) {
                        this._isCompiled = false;
                        this.reportScriptErrors('globalCache', result.messages);
                    }
                })
            })
            .then(() => {
                if (!this._localCacheProcessor) {
                    return;
                }

                return this._localCacheProcessor!.prepare().then((result) => {
                    this._logger.verbose("[compile] _localCacheProcessor prepare: ", result);
                    if (!result.success) {
                        this._isCompiled = false;
                        this.reportScriptErrors('cache', result.messages);
                    }
                })
            })
            ;
    }

    reportScriptErrors(source: string, messages: string[])
    {
        this._hasRuntimeErrors = true;

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

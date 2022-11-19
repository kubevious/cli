import _ from 'the-lodash'
import { ILogger } from 'the-logger';
import { Promise, Resolvable } from 'the-promise'
import { ScriptItem } from '../../script-item'
import { CompilerScopeDict, Compiler } from '@kubevious/kubik/dist/processors/compiler';
import { ExecutionContext } from '../../execution/execution-context'
import { TopLevelQuery } from '../target/types';
import { buildQueryableScope } from '../../query-spec/sync-scope-builder';

export interface ValidationProcessorResult {
    success: boolean
    messages: string[]
    validation: {
        hasErrors: boolean
        hasWarnings: boolean
        errorMsgs: {
            [name: string]: boolean
        }
        warnMsgs: {
            [name: string]: boolean
        }
        marks?: {
            [name: string]: boolean
        }
    }
}


export class ValidationProcessor {
    private _runnable: null | Resolvable<any>;
    private _src: string;
    private _logger : ILogger;
    private _executionContext : ExecutionContext;

    constructor(src: string, executionContext : ExecutionContext) {
        this._src = src;
        this._executionContext = executionContext;
        this._runnable = null;
        this._logger = executionContext.logger.sublogger('ValidationProcessor');
    }

    prepare() {
        const result = {
            success: false,
            messages: [],
        }

        return this._loadModule()
            .then((runnable) => {
                this._runnable = runnable
            })
            .then(() => {
                this._validate()
                result.success = result.messages.length == 0
            })
            .catch((reason) => {
                result.success = false
                this._addError(result.messages, reason.message)
            })
            .then(() => result)
    }

    private _loadModule() {
        return Promise.resolve().then(() => {
            const compilerValues: CompilerScopeDict = {
                item: null,
                config: null,
                cache: null,
                values: null,
                error: null,
                warning: null,
                mark: null,
            }

            for(const x of _.keys(TopLevelQuery))
            {
                compilerValues[x] = null;
            }

            const compiler = new Compiler(
                this._src,
                'RULE_VALIDATOR',
                compilerValues
            )
            return compiler.compile()
        })
    }

    private _validate() {}

    execute(item: ScriptItem, cache: Record<string, any>, values: Record<string, any>) : Promise<ValidationProcessorResult> {
        const result: ValidationProcessorResult = {
            success: false,
            messages: [],
            validation: {
                hasErrors: false,
                hasWarnings: false,
                errorMsgs: {},
                warnMsgs: {},
            },
        }

        return Promise.resolve()
            .then(() => {

                const valueMap : Record<string, any> = {
                    item: item,
                    values: values,
                    config: item.config,
                    cache: cache,
                    error: (msg: string) => {
                        result.validation.hasErrors = true
                        if (msg) {
                            result.validation.errorMsgs[msg] = true
                        }
                    },
                    warning: (msg: string) => {
                        result.validation.hasWarnings = true
                        if (msg) {
                            result.validation.warnMsgs[msg] = true
                        }
                    },
                    mark: (kind: string) => {
                        if (!result.validation.marks) {
                            result.validation.marks = {}
                        }
                        result.validation.marks[kind] = true
                    },
                }
                
                this._setupQueryBuilders(valueMap, item);

                // console.log("HEADERS: ", _.keys(valueMap))

                return this._runnable!.run(valueMap);
            })
            .then(() => {
                result.success = true
            })
            .catch((reason: Error) => {
                this._logger.info("[execute] error: ", reason);
                result.success = false
                this._addError(result.messages!, reason.message)
            })
            .then(() => result)
    }

    private _setupQueryBuilders(valueMap: Record<string, any>, item: ScriptItem)
    {
        const queryScope = buildQueryableScope(this._executionContext);
        for(const key of _.keys(queryScope))
        {
            valueMap[key] = queryScope[key];
        }
    }

    private _addError(list: string[], msg: string) {
        list.push(msg)
    }
}

import _ from 'the-lodash'
import { Promise } from 'the-promise'
import { Compiler, CompilerScopeDict } from '@kubevious/kubik/dist/processors/compiler';
import { RootScopeBuilder } from '../../scope-builders'
import { ScriptItem } from '../../script-item'
import { ExecutionContext } from '../../execution/execution-context'
import { RuleApplicationScope } from '../../registry/types';
import { RuleOverrideValues } from '../../spec/rule-spec';
import { buildQueryScopes } from '../../query-spec/scope-builder';
import { BaseTargetQuery } from '../../query-spec/base';
import { ILogger } from 'the-logger/dist';

export class TargetProcessor {
    private _src: string;
    private _errorMessages: string[];
    private _executionContext : ExecutionContext;
    private _logger : ILogger;

    private _queryTarget : {
        target: BaseTargetQuery | null
    } = {
        target: null
    }

    constructor(src: string, executionContext : ExecutionContext) {
        this._src = src
        this._errorMessages = [];
        this._executionContext = executionContext;
        this._logger = executionContext.logger.sublogger("TargetProcessor");
    }

    prepare() {
        this._errorMessages = []
        const result = {
            success: false,
            messages: this._errorMessages,
        }

        return this._loadModule()
            .then((runnable) => runnable.run())
            .then(() => {
                this._validate();
                result.success = result.messages.length == 0
            })
            .catch((reason) => {
                result.success = false
                this._addError(reason.message)
            })
            .then(() => result)
    }

    execute(applicationScope: RuleApplicationScope, values: RuleOverrideValues): Promise<ScriptItem[]> {
        // const rootScope : CompilerScopeDict = {};
        // rootScope['values'] = values ?? {};

        // TODO: use applicationScope

        return Promise.resolve()
            .then(() => {
                const queryTarget = this._queryTarget.target;
                if (!queryTarget) {
                    return [];
                }

                const result = this._executionContext.queryExecutor.execute(queryTarget);
                return result.items ?? [];
            })


        // const fetcher = new QueryFetcher(this._executionContext, this._scope);
        // const result = fetcher.execute(applicationScope);
        // return Promise.resolve(result.items);
    }

    private _loadModule() {
        
        const rootScope : CompilerScopeDict = {
            _query: this._queryTarget,
            values: null
        };

        const rootScopeBuilder : RootScopeBuilder = {
            setup: (name: string, func: any) => {
                rootScope[name] = func;
            }
        }

        return Promise.resolve().then(() => {

            this._setupQueryBuilders(rootScopeBuilder);

            const src = `_query.target = ${this._src};`;

            const compiler = new Compiler(
                src,
                'RULE_TARGET',
                rootScope
            )
            return compiler.compile()
        })
    }

    private _setupQueryBuilders(rootScopeBuilder : RootScopeBuilder)
    {
        const queryScope = buildQueryScopes(this._executionContext);
        for(const key of _.keys(queryScope))
        {
            rootScopeBuilder.setup(key, queryScope[key]);
        }
    }

    private _validate() {
        if (!this._queryTarget.target) {
            this._addError('No target specified.')
            return
        }

        this._validateQueryScope(this._queryTarget.target);
    }

    private _validateQueryScope(query: BaseTargetQuery)
    {
        this._logger.info("[_validateQueryScope] kind: %s", query.kind);
        if (!query.kind) {
            this._addError('Unknown target specified.');
        }
    }

    private _addError(msg: string) {
        // console.log("[TARGET-PROCESSOR] ERROR: ", msg)
        this._errorMessages.push(msg)
    }
}

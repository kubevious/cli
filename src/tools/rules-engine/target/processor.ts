import _ from 'the-lodash'
import { Promise } from 'the-promise'
import { Compiler, CompilerScopeDict } from '@kubevious/kubik/dist/processors/compiler';
import { BaseScopeQuery, Scope, ScopeQueryKind } from '../scope'
import { makeTargetRootScope } from './scope-builder'
import { RootScopeBuilder } from '../scope-builders'
import { ScopeK8sQuery } from './k8s-target-builder'
import { ScriptItem } from '../script-item'
import { ExecutionContext } from '../execution-context'
import { QueryFetcher } from '../query/fetcher'
import { RuleApplicationScope } from '../types/rules';
import { RuleOverrideValues } from '../spec/rule-spec';

export class TargetProcessor {
    private _src: string;
    private _errorMessages: string[];
    private _scope: Scope;
    private _executionContext : ExecutionContext;

    constructor(src: string, executionContext : ExecutionContext) {
        this._src = src
        this._scope = new Scope();
        this._errorMessages = [];
        this._executionContext = executionContext;
    }

    get scope() {
        return this._scope
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
                this._scope.finalize();
            })
            .then(() => {
                this._validate()
                result.success = result.messages.length == 0
            })
            .catch((reason) => {
                result.success = false
                this._addError(reason.message)
            })
            .then(() => result)
    }

    execute(applicationScope: RuleApplicationScope, values: RuleOverrideValues): Promise<ScriptItem[]> {
        const rootScope : CompilerScopeDict = {};
        rootScope['values'] = values ?? {};

        const fetcher = new QueryFetcher(this._executionContext, this._scope);
        const result = fetcher.execute(applicationScope);
        return Promise.resolve(result.items);
    }

    private _loadModule() {
        
        const rootScope : CompilerScopeDict = {
            values: null
        };

        const rootScopeBuilder : RootScopeBuilder = {
            setup: (name: string, func: any) => {
                rootScope[name] = func;
            }
        }

        return Promise.resolve().then(() => {
            makeTargetRootScope(rootScopeBuilder, this._executionContext, this._scope);

            const compiler = new Compiler(
                this._src,
                'RULE_TARGET',
                rootScope
            )
            return compiler.compile()
        })
    }

    private _validate() {
        if (!this._scope.query) {
            this._addError('No target specified.')
            return
        }

        this._validateQueryScope(this._scope.query);
    }

    private _validateQueryScope(query: BaseScopeQuery) {
        if (query.kind === ScopeQueryKind.K8s) {
            this._validateK8sQuery(query as ScopeK8sQuery);
            return
        }
    }

    private _validateK8sQuery(query: ScopeK8sQuery) {
        
    }

    private _addError(msg: string) {
        // console.log("[TARGET-PROCESSOR] ERROR: ", msg)
        this._errorMessages.push(msg)
    }
}

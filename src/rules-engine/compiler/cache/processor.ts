import _ from 'the-lodash'
import { Promise, Resolvable } from 'the-promise'
import { CompilerScopeDict, Compiler } from '@kubevious/kubik/dist/processors/compiler';
import { ExecutionContext } from '../../execution/execution-context'
import { ILogger } from 'the-logger/dist';
import { buildQueryableScope } from '../../query-spec/sync-scope-builder';
import { TARGET_QUERY_BUILDER_DICT } from '../../query-spec/scope-builder';
import { RULE_HELPERS } from '../../helpers/rule-helpers';

export interface CacheProcessorResult {
    success: boolean,
    messages: string[],
    namespace: string | null,
    cache: Record<string, any>
}

export class CacheProcessor
{
    private _logger: ILogger;
    private _runnable: null | Resolvable<any>;
    private _src: string;
    private _executionContext : ExecutionContext;

    constructor(src: string, executionContext : ExecutionContext) {
        this._src = src;
        this._logger = executionContext.logger.sublogger("CacheProcessor");
        this._executionContext = executionContext;
        this._runnable = null;
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
                result.success = false;
                this._logger.info("[prepare] error: %s", reason?.message);
                // this._logger.info("[prepare] error: ", reason);
                this._addError(result.messages, reason.message);
                // this._logger.info("[prepare] %s", reason);
            })
            .then(() => result)
    }

    private _loadModule() {
        return Promise.resolve().then(() => {
            const compilerValues: CompilerScopeDict = {
                namespace: null,
                cache: null,
                values: null,
                helpers: null,
            }

            for(const x of _.keys(TARGET_QUERY_BUILDER_DICT))
            {
                compilerValues[x] = null;
            }

            const compiler = new Compiler(
                this._src,
                'RULE_CACHE',
                compilerValues
            )
            return compiler.compile()
        })
    }

    private _validate() {}

    execute(namespace: string | null, values: Record<string, any>) : Promise<CacheProcessorResult> {
        const result: CacheProcessorResult = {
            success: false,
            messages: [],
            namespace: namespace,
            cache: {}
        }

        return Promise.resolve()
            .then(() => {

                const valueMap : Record<string, any> = {
                    namespace: namespace,
                    cache: result.cache,
                    values: values,
                    helpers: RULE_HELPERS,
                }
                
                this._setupQueryBuilders(valueMap, namespace);

                return this._runnable!.run(valueMap);
            })
            .then(() => {
                result.success = true
            })
            .catch((reason: Error) => {
                result.success = false
                this._addError(result.messages!, reason.message)
                // this._logger.info("[execute] %s", reason);

            })
            .then(() => result)
    }

    private _setupQueryBuilders(valueMap: Record<string, any>, namespace: string | null)
    {
        const queryScope = buildQueryableScope(this._executionContext, { namespace: namespace });
        for(const key of _.keys(queryScope))
        {
            valueMap[key] = queryScope[key];
        }
    }

    private _addError(list: string[], msg: string) {
        this._logger.info("[RULE ERROR] %s", msg);
        list.push(msg)
    }
}

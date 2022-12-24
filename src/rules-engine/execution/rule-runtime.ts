import _ from 'the-lodash';
import { Promise as MyPromise } from 'the-promise';
import { ILogger } from 'the-logger';
import { CommonRule, NamespaceRule, RuleApplicationScope, RuleKind, RuleObject } from '../registry/types';
import { RuleCompiler } from '../compiler/rule-compiler';
import { RuleOverrideValues } from '../spec/rule-spec';
import { K8sManifest } from '../../manifests/k8s-manifest';
import { RuleResult } from '../../types/rules-result';
import { RulesRuntime } from './rules-runtime';
import { RuleExecutionRuntime } from './rule-execution-runtime';
import { ResultObjectSeverity, setupBaseObjectSeverity } from '../../types/result';
import { ManifestViolation } from './manifest-violation';
import { ManifestResult } from '../../types/manifest-result';
import { ScriptItem } from '../script-item';

export class RuleRuntime
{
    private _logger: ILogger;

    private _rulesRuntime : RulesRuntime;
    private _rule: CommonRule;

    private _executors: RuleExecutionRuntime[] = [];

    private _compiler : RuleCompiler | undefined = undefined;
    private _violations : ManifestViolation[] = [];
    private _passed : K8sManifest[] = [];

    private _ruleCacheData : RuleCache = {
        global: null,
        cluster: null,
        namespaces: {} 
    }


    constructor(logger: ILogger,
                rule: CommonRule,
                rulesRuntime : RulesRuntime,
                )
    {
        this._logger = logger.sublogger('RuleRuntime');
        this._rule = rule;
        this._rulesRuntime = rulesRuntime;
    }

    get rule() {
        return this._rule;
    }

    get ruleObject() : RuleObject {
        return this._rule;
    }

    get manifest() : K8sManifest {
        return this._rule.manifest;
    }

    get compiler() {
        return this._compiler;
    }

    get isCompiled() {
        return this._compiler?.isCompiled ?? false;
    }

    get hasRuntimeErrors() {
        return this._compiler?.hasRuntimeErrors ?? false;
    }

    get ruleErrors() {
        return this._compiler?.ruleErrors ?? [];
    }

    get violations() {
        return this._violations;
    }

    get passed() {
        return this._passed;
    }

    get ruleEngineReporter() {
        return this._rulesRuntime.ruleEngineReporter;
    }
    
    public async init()
    {
        if (this._rule.hasUnmedDependency) {
            this._logger.info("[init] skipping %s. Has Unmet Dependency.", this.rule.name);
        }

        if (this._rule.isDisabled) {
            this._logger.info("[init] skipping %s. Is Disabled.", this.rule.name);
            return;
        }

        await this._prepareRule();
    }

    private async _prepareRule()
    {
        // this._logger.info("[_prepareRule] %s :: %s ::%s...", ruleObject.kind, ruleObject.namespace, ruleObject.name)
        const compiler = new RuleCompiler(this._logger,
                                          this.ruleObject,
                                          this._rulesRuntime.targetExecutionContext, 
                                          this._rulesRuntime.validatorExecutionContext);
        await compiler.compile();

        this._logger.info("[_prepareRule]   - isCompiled: %s", compiler.isCompiled);
        this._logger.info("[_prepareRule]   - hasRuntimeErrors: %s", compiler.hasRuntimeErrors);
        this._logger.info("[_prepareRule]   - errors: ", compiler.ruleErrors);

        for(const error of compiler.ruleErrors)
        {
            this.manifest.reportError(error.msg);
        }

        this._compiler = compiler;
    }

    public setupApplication(application?: RuleApplicationScope,
                            values?: RuleOverrideValues)
    {
        if (!this._compiler) {
            return;
        }

        application = application ?? {};
        values = values ?? {};

        values = makeValues([values, this._rule.values]);

        const ruleExecutionRuntime = new RuleExecutionRuntime(this._logger,
                                                              this.manifest,
                                                              this._rule,
                                                              this,
                                                              application,
                                                              values);
        this._executors.push(ruleExecutionRuntime);        
    }

    execute()
    {
        this._logger.info("[execute] Rule: %s. Executors: %s", this.rule.name, this._executors.length);
        return MyPromise.serial(this._executors, x => this._executeRule(x))
    }

    private _executeRule(executor : RuleExecutionRuntime)
    {
        this._logger.info("[_executeRule] applicator: ", executor.application);

        return MyPromise.timeout(1)
            .then(() => executor.execute())
            ;
    }


    exportResult() : RuleResult
    {
        const ruleManifestResult = this.manifest.exportResult();

        const ruleErrors = (this.ruleErrors ?? []).map(x => x.msg);
        for(const error of ruleErrors)
        {
            if (!ruleManifestResult.messages) {
                ruleManifestResult.messages = [];
            }
            ruleManifestResult.messages.push({ severity: 'error', msg: error });
        }

        // TODO: Take this out later and avoid duplicates in the first place
        ruleManifestResult.messages = _.uniqBy(ruleManifestResult.messages, x => _.stableStringify(x));

        setupBaseObjectSeverity(ruleManifestResult);

        const violations = this._violations.map(x => x.exportResult());

        const hasViolationErrors = _.some(violations, x => x.severity === 'fail');
        const hasViolationWarnings = _.some(violations, x => x.severity === 'warning');

        let ruleSeverity : ResultObjectSeverity = 'pass';
        if (hasViolationErrors) {
            ruleSeverity = 'fail';
        } else if (hasViolationWarnings) {
            ruleSeverity = 'warning';
        }

        const result : RuleResult = {
            ruleManifest: ruleManifestResult,
            compiled: this.isCompiled && !this.hasRuntimeErrors,
            pass: !hasViolationErrors,
            ruleSeverity: ruleSeverity,
            hasViolationErrors: hasViolationErrors,
            hasViolationWarnings: hasViolationWarnings,
            violations: violations,
            passed: this.passed.map(x => this._exportPassedManifest(x))
        };

        if (this.rule.kind == RuleKind.Rule)
        {
            result.namespace = (this.rule as NamespaceRule).namespace;
        }

        return result;
    }


    public async processGlobalCache(values: RuleOverrideValues) : Promise<CacheRunResult>
    {
        if (!this._compiler || !this._compiler.isCompiled) {
            return {
                success: false,
                cache: {}
            };
        }

        if (!this._compiler.globalCacheProcessor) {
            return {
                success: true,
                cache: {}
            };
        }

        // this._logger.info("[processGlobalCache] %s :: %s", item.apiVersion, item.kind);

        if (this._ruleCacheData.global) {
            return {
                success: true,
                cache: this._ruleCacheData.global.cache
            };
        }

        const result = await this._compiler.globalCacheProcessor.execute(null, values);
        const clusterData : RuleCacheScope = {
            cache: result.cache
        };
        this._ruleCacheData.global = clusterData;

        return {
            success: true,
            cache: clusterData.cache
        }
    }

    public async processLocalCache(item: ScriptItem, values: RuleOverrideValues) : Promise<CacheRunResult>
    {
        if (!this._compiler || !this._compiler.isCompiled) {
            return {
                success: false,
                cache: {}
            };
        }

        if (!this._compiler.localCacheProcessor) {
            return {
                success: true,
                cache: {}
            };
        }

        const namespace = item.namespace;
        if (namespace)
        {
            if (this._ruleCacheData.namespaces[namespace]) {
                return {
                    success: true,
                    cache: this._ruleCacheData.namespaces[namespace].cache
                };
            }

            const result = await this._compiler.localCacheProcessor.execute(namespace, values);
            const namespaceData : RuleCacheScope = {
                cache: result.cache
            };

            this._ruleCacheData.namespaces[namespace] = namespaceData;

            return {
                success: true,
                cache: namespaceData.cache
            }
        }
        else
        {
            if (this._ruleCacheData.cluster) {
                return {
                    success: true,
                    cache: this._ruleCacheData.cluster.cache
                };
            }

            const result = await this._compiler.localCacheProcessor.execute(null, values);
            const clusterData : RuleCacheScope = {
                cache: result.cache
            };
            this._ruleCacheData.cluster = clusterData;

            return {
                success: true,
                cache: clusterData.cache
            }
        }
    }


    private _exportPassedManifest(manifest: K8sManifest) : ManifestResult
    {
        const result : ManifestResult = {
            ...manifest.id,
            severity: 'pass',
            sources: manifest.exportSourcesResult(),
        };
        return result;
    }
}

export function makeValues(valuesArray: RuleOverrideValues[])
{
    valuesArray = valuesArray.map(x => x);
    let result : RuleOverrideValues = {};
    for(const x of valuesArray)
    {
        result = _.defaults(result, x);
    }
    return result;
}



export interface CacheRunResult
{
    success: boolean,
    cache: Record<string, any>
}


interface RuleCache
{
    global: RuleCacheScope | null;
    cluster: RuleCacheScope | null;
    namespaces: Record<string, RuleCacheScope>;
}

interface RuleCacheScope
{
    cache: Record<string, any>;
}

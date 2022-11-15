import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { ApplicatorRule, ClusterRule, NamespaceRule, RuleApplicationScope, RuleObject } from '../registry/types';
import { RuleRegistry } from '../registry/rule-registry';
import { RuleRuntime } from './rule-runtime';
import { RegistryQueryExecutor } from '../query-executor';
import { ExecutionContext } from './execution-context';
import { ManifestPackage } from '../../manifests/manifest-package';
import { RuleEngineReporter } from '../reporting/rule-engine-reporter';
import { ISpinner, spinOperation } from '../../screen/spinner';
import { RuleCompiler } from '../compiler/rule-compiler';
import { RuleOverrideValues } from '../spec/rule-spec';

export class RulesRuntime
{
    private _logger: ILogger;
    private _ruleRegistry: RuleRegistry;

    private _clusterRules : Record<string, {
        rule: ClusterRule,
        compiler?: RuleCompiler,
    }> = {};
    private _rules : RuleRuntime[] = [];

    private _namespaces: string[];
    private _targetExecutionContext : ExecutionContext;
    private _validatorExecutionContext : ExecutionContext;
    private _ruleEngineReporter : RuleEngineReporter;
    private _spinner? : ISpinner;

    constructor(logger: ILogger,
                ruleRegistry: RuleRegistry,
                manifestPackage: ManifestPackage,
                namespaces: string[],
                targetQueryExecutor: RegistryQueryExecutor,
                validatorQueryExecutor: RegistryQueryExecutor)
    {
        this._logger = logger.sublogger('RulesRuntime');
        this._ruleRegistry = ruleRegistry;
        this._namespaces = namespaces;
        this._targetExecutionContext = new ExecutionContext(this._logger, targetQueryExecutor, manifestPackage);
        this._validatorExecutionContext = new ExecutionContext(this._logger, validatorQueryExecutor, manifestPackage);
        this._ruleEngineReporter = new RuleEngineReporter(this._logger, manifestPackage);
    }

    get rules() {
        return this._rules;
    }

    init()
    {
        return Promise.resolve()
            .then(() => this._initClusterRules())
            .then(() => this._initRules())
            .then(() => this._initRuleApplicators())
    }

    execute()
    {
        this._spinner = spinOperation('Validating rules...');

        return Promise.serial(this._rules, x => this._executeRule(x))
            .then(() => {
                this._spinner!.complete('Rules validation complete.')
            });
    }

    private _initClusterRules()
    {
        return Promise.serial(this._ruleRegistry.clusterRules, x => {
            return this._initClusterRule(x);
        });
    }

    private _initClusterRule(clusterRule: ClusterRule)
    {
        this._logger.info("[_initClusterRule] %s...", clusterRule.name);

        if (clusterRule.spec.disabled) {
            this._clusterRules[clusterRule.name] = {
                rule: clusterRule
            }
            return;
        }

        const compiler = new RuleCompiler(this._logger, clusterRule, this._targetExecutionContext, this._validatorExecutionContext);
        return compiler.compile()
            .then(() => {
                this._clusterRules[clusterRule.name] = {
                    rule: clusterRule,
                    compiler: compiler,
                }

                if (clusterRule.clustered)
                {
                    this._setupClusterRuleRuntime(clusterRule, compiler);
                }
                else
                {
                    if (!clusterRule.useApplicator)
                    {
                        this._setupClusterRuleApplication(clusterRule, compiler);
                    }
                }
            });
    }

    private _setupClusterRuleApplication(clusterRule: ClusterRule, compiler: RuleCompiler)
    {
        let namespaces = this._namespaces;
        if (clusterRule.onlySelectedNamespaces)
        {
            namespaces = namespaces.filter(x => clusterRule.namespaces[x]);
        }
        for(const ns of namespaces)
        {
            this._setupClusterRuleRuntime(clusterRule, compiler, ns);
        }
    }

    private _setupClusterRuleRuntime(clusterRule: ClusterRule, compiler: RuleCompiler, namespace? : string)
    {
        this._logger.info("[_setupClusterRuleRuntime] >>> %s...", clusterRule.name);

        const application: RuleApplicationScope = {
        }

        if (namespace) {
            application.namespace = namespace;
        }

        let values = clusterRule.values;
        if (namespace) {
            const ruleNamespaceInfo = clusterRule.namespaces[namespace];
            values = this._makeValues([ruleNamespaceInfo?.values, values]);
        }

        const ruleRuntime = new RuleRuntime(this._logger,
            clusterRule.manifest,
            compiler.rule,
            this._ruleEngineReporter,
            compiler,
            application,
            values);
        this._rules.push(ruleRuntime);
    }

    private _initRules()
    {
        return Promise.serial(this._ruleRegistry.rules, x => {
            return this._initRule(x);
        });
    }

    private _initRule(rule: NamespaceRule)
    {
        this._logger.info("[_initRule] %s :: %s...", rule.namespace, rule.name);

        if (rule.spec.disabled) {
            return;
        }

        const compiler = new RuleCompiler(this._logger, rule, this._targetExecutionContext, this._validatorExecutionContext);
        return compiler.compile()
            .then(() => {
                const ruleRuntime = new RuleRuntime(this._logger,
                                                    rule.manifest,
                                                    rule,
                                                    this._ruleEngineReporter,
                                                    compiler,
                                                    { namespace: rule.namespace },
                                                    rule.values
                                                    );
                this._rules.push(ruleRuntime);
            });
    }

    private _initRuleApplicators()
    {
        return Promise.serial(this._ruleRegistry.ruleApplicators, x => {
            return this._initRuleApplicator(x);
        });
    }

    private _initRuleApplicator(applicator: ApplicatorRule)
    {
        this._logger.info("[_initRuleApplicator] %s :: %s...", applicator.namespace, applicator.name);

        if (applicator.spec.disabled) {
            return;
        }

        const clusterRefName = applicator.spec.clusterRuleRef.name;
        if (!clusterRefName) {
            return;
        }

        const clusterRuleInfo = this._clusterRules[clusterRefName];
        if (!clusterRuleInfo) {
            return;
        }
        if (!clusterRuleInfo.compiler) {
            return;
        }

        if (!clusterRuleInfo.rule.useApplicator) {
            return;
        }
        if (clusterRuleInfo.rule.spec.disabled) {
            return;
        }

        const ruleNamespaceInfo = clusterRuleInfo.rule.namespaces[applicator.namespace];
        if (clusterRuleInfo.rule.onlySelectedNamespaces) {
            if (!ruleNamespaceInfo) {
                return;
            }
        }

        const ruleConfig : RuleObject = _.clone(clusterRuleInfo.rule);
        ruleConfig.kind = applicator.kind;
        ruleConfig.name = applicator.name;
        ruleConfig.namespace = applicator.namespace;

        const ruleRuntime = new RuleRuntime(this._logger,
            applicator.manifest,
            ruleConfig,
            this._ruleEngineReporter,
            clusterRuleInfo.compiler,
            { namespace: ruleConfig.namespace },
            this._makeValues([applicator.values, ruleNamespaceInfo?.values, ruleConfig.values])
            );
        this._rules.push(ruleRuntime);
    }

    private _executeRule(rule : RuleRuntime)
    {
        return Promise.resolve()
            .then(() => rule.execute())
            ;
    }

    private _makeValues(valuesArray: RuleOverrideValues[])
    {
        valuesArray = valuesArray.map(x => x);
        let result : RuleOverrideValues = {};
        for(const x of valuesArray)
        {
            result = _.defaults(result, x);
        }
        return result;
    }
}



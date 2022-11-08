import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { ApplicatorRule, ClusterRule, NamespaceRule, RuleObject } from './types/rules';
import { RuleRegistry } from './rule-registry';
import { RuleRuntime } from './rule-runtime';
import { RegistryQueryExecutor } from './query-executor';
import { ExecutionContext } from './execution-context';
import { ManifestPackage } from '../manifest-package';
import { RuleEngineReporter } from './rule-engine-reporter';
import { ISpinner, spinOperation } from '../../utils/screen';
import { RuleCompiler } from './rule-compiler';

export class RulesRuntime
{
    private _logger: ILogger;
    private _ruleRegistry: RuleRegistry;

    private _clusterRules : Record<string, {
        rule: ClusterRule,
        compiler: RuleCompiler,
    }> = {};
    private _rules : RuleRuntime[] = [];

    private _manifestPackage : ManifestPackage;
    private _executionContext : ExecutionContext;
    private _ruleEngineReporter : RuleEngineReporter;
    private _spinner? : ISpinner;
    private _namespaces : string[] = [];

    constructor(logger: ILogger,
                ruleRegistry: RuleRegistry,
                registryQueryExecutor: RegistryQueryExecutor,
                manifestPackage: ManifestPackage)
    {
        this._logger = logger.sublogger('RulesRuntime');
        this._ruleRegistry = ruleRegistry;
        this._manifestPackage = manifestPackage;
        this._executionContext = new ExecutionContext(this._logger, registryQueryExecutor, manifestPackage);
        this._ruleEngineReporter = new RuleEngineReporter(this._logger, manifestPackage);
        this._produceNamespaces();
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
            })
    }

    private _initClusterRules()
    {
        return Promise.serial(this._ruleRegistry.clusterRules, x => {
            return this._initClusterRule(x);
        });
    }

    private _initClusterRule(clusterRule: ClusterRule)
    {
        const compiler = new RuleCompiler(this._logger, clusterRule, this._executionContext);
        return compiler.compile()
            .then(() => {
                this._clusterRules[clusterRule.name] = {
                    rule: clusterRule,
                    compiler: compiler,
                }

                if (!clusterRule.useApplicator)
                {
                    for(const ns of this._namespaces)
                    {
                        const ruleNamespace = clusterRule.namespaces[ns];
                        
                        const ruleRuntime = new RuleRuntime(this._logger,
                            compiler.rule,
                            this._ruleEngineReporter,
                            compiler,
                            { namespace: ns },
                            this._makeValues([ ruleNamespace?.values, clusterRule.values ]));
                        this._rules.push(ruleRuntime);
                    }
                }
            });
    }

    private _initRules()
    {
        return Promise.serial(this._ruleRegistry.rules, x => {
            return this._initRule(x);
        });
    }

    private _initRule(rule: NamespaceRule)
    {
        const compiler = new RuleCompiler(this._logger, rule, this._executionContext);
        return compiler.compile()
            .then(() => {
                const ruleRuntime = new RuleRuntime(this._logger,
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
        const clusterRefName = applicator.spec.clusterRuleRef.name;
        if (!clusterRefName) {
            return;
        }

        const clusterRuleInfo = this._clusterRules[clusterRefName];
        if (!clusterRuleInfo) {
            return;
        }

        if (!clusterRuleInfo.rule.useApplicator) {
            return;
        }

        const ruleNamespaceValues = clusterRuleInfo.rule.namespaces[applicator.namespace];

        const ruleConfig : RuleObject = _.clone(clusterRuleInfo.rule);
        ruleConfig.kind = applicator.kind;
        ruleConfig.name = applicator.name;
        ruleConfig.namespace = applicator.namespace;

        const ruleRuntime = new RuleRuntime(this._logger,
            ruleConfig,
            this._ruleEngineReporter,
            clusterRuleInfo.compiler,
            { namespace: ruleConfig.namespace },
            this._makeValues([applicator.values, ruleNamespaceValues, ruleConfig.values])
            );
        this._rules.push(ruleRuntime);
    }

    private _executeRule(rule : RuleRuntime)
    {
        return Promise.resolve()
            .then(() => rule.execute());
    }

    private _produceNamespaces()
    {
        const namespaces : Record<string, boolean> = {};
        for(const x of this._manifestPackage.manifests)
        {
            if (x.id.namespace) {
                namespaces[x.id.namespace] = true;
            }
        }
        this._namespaces = _.keys(namespaces);
    }

    private _makeValues(valuesArray: Record<string, any>[])
    {
        valuesArray = valuesArray.map(x => x);
        let result : Record<string, any> = {};
        for(const x of valuesArray)
        {
            result = _.defaultTo(result, x);
        }
        return result;
    }
}



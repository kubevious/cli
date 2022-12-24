import _ from 'the-lodash';
import { Promise as MyPromise } from 'the-promise';
import { ILogger } from 'the-logger';
import { ApplicatorRule, ClusterRule, CommonRule, NamespaceRule, RuleApplicationScope, RuleKind } from '../registry/types';
import { RuleRegistry } from '../registry/rule-registry';
import { RegistryQueryExecutor } from '../query-executor';
import { ExecutionContext } from './execution-context';
import { ManifestPackage } from '../../manifests/manifest-package';
import { RuleEngineReporter } from '../reporting/rule-engine-reporter';
import { ISpinner, spinOperation } from '../../screen/spinner';
import { RuleDependency, RuleOverrideValues } from '../spec/rule-spec';
import { checkKubeviousVersion } from '../../utils/version-checker';
import { RuleEngineResult } from '../../types/rules-result';
import { makeObjectSeverity } from '../../types/result';
import { makeValues, RuleRuntime } from './rule-runtime';

export class RulesRuntime
{
    private _logger: ILogger;
    private _ruleRegistry: RuleRegistry;

    private _rules : RuleRuntime[] = [];
    private _clusterRulesDict : Record<string, RuleRuntime> = {};

    private _manifestPackage: ManifestPackage;
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
        this._manifestPackage = manifestPackage;
        this._targetExecutionContext = new ExecutionContext(this._logger, targetQueryExecutor, manifestPackage);
        this._validatorExecutionContext = new ExecutionContext(this._logger, validatorQueryExecutor, manifestPackage);
        this._ruleEngineReporter = new RuleEngineReporter(this._logger, manifestPackage);
    }

    get rules() {
        return this._rules;
    }

    public get targetExecutionContext() {
        return this._targetExecutionContext;
    }

    public get validatorExecutionContext() {
        return this._validatorExecutionContext;
    }

    public get ruleEngineReporter() {
        return this._ruleEngineReporter;
    }

    init()
    {
        return MyPromise.resolve()
            .then(() => this._checkDependencies())
            .then(() => this._initClusterRules())
            .then(() => this._initNamespaceRules())
            .then(() => this._initRuleApplicators())
    }

    execute()
    {
        this._logger.info("[execute] Begin. Count: %s", this._rules.length);

        this._spinner = spinOperation('Validating rules...');

        return MyPromise.serial(this._rules, x => this._executeRule(x))
            .then(() => {
                this._spinner!.complete('Rules validation complete.')
            });
    }


    exportResult() : RuleEngineResult
    {
        const result : RuleEngineResult = {
            success: true,
            severity: 'pass',
            rules: this.rules.map(x => x.exportResult()),
        };
        
        // result.severity = makeObjectSeverityFromChildren(result.severity, result.rules.map(x => x.ruleManifest));
        result.severity = makeObjectSeverity(result.severity, result.rules.map(x => x.ruleSeverity));
        result.success = result.severity == 'pass' || result.severity == 'warning';

        return result;
    }

    private _checkDependencies()
    {
        for(const rule of this._ruleRegistry.clusterRules)
        {
            this._checkRuleDependencies(rule);
        }

        for(const rule of this._ruleRegistry.rules)
        {
            this._checkRuleDependencies(rule);
        }
    }

    private _checkRuleDependencies(rule: CommonRule)
    {
        for(const dependency of rule.dependencies)
        {
            if(rule.isDisabled) {
                return;
            }
            this._checkRuleDependency(rule, dependency);
        }
    }

    private _checkRuleDependency(rule: CommonRule, dependency: RuleDependency)
    {
        if (dependency.name === 'kubevious')
        {
            if (!checkKubeviousVersion(dependency.minVersion, dependency.maxVersion, dependency.range))
            {
                if (!rule.hasUnmedDependency)
                {
                    rule.manifest.reportWarning('Has unmet Kubevious CLI version dependency. Try updating to latest Kubevious CLI version.');
                    rule.hasUnmedDependency = true;
                    rule.isDisabled = true;
                }
            }
        }
    }

    private _initClusterRules()
    {
        return MyPromise.serial(this._ruleRegistry.clusterRules, x => {
            return MyPromise.resolve(this._initClusterRule(x));
        });
    }

    private async _initClusterRule(clusterRule: ClusterRule)
    {
        const r = new RuleRuntime(this._logger,
                                  clusterRule,
                                  this);
        this._clusterRulesDict[r.rule.name] = r;
        this._rules.push(r);
        
        await r.init();

        this._logger.info("[_initClusterRule] clustered: %s", clusterRule.clustered);
        this._logger.info("[_initClusterRule] useApplicator: %s", clusterRule.useApplicator);

        if (clusterRule.clustered)
        {
            const application: RuleApplicationScope = { };

            r.setupApplication(application, clusterRule.values);
        }
        else
        {
            if (clusterRule.useApplicator)
            {
                return;
            }

            let namespaces = this._namespaces;
            if (clusterRule.onlySelectedNamespaces)
            {
                namespaces = namespaces.filter(x => clusterRule.namespaces[x]);
            }

            for(const namespace of namespaces)
            {
                const application: RuleApplicationScope = {
                    namespace: namespace
                }

                const ruleNamespaceInfo = clusterRule.namespaces[namespace];

                r.setupApplication(application, ruleNamespaceInfo?.values);
            }
        }

    }

    private _initNamespaceRules()
    {
        return MyPromise.serial(this._ruleRegistry.rules, x => {
            return this._initNamespaceRule(x);
        });
    }

    private _initNamespaceRule(rule: NamespaceRule)
    {
        this._logger.info("[_initNamespaceRule] %s :: %s...", rule.namespace, rule.name);

        const r = new RuleRuntime(this._logger,
                                  rule,
                                  this);
        this._rules.push(r);

        const application: RuleApplicationScope = {
            namespace: rule.namespace
        }

        r.setupApplication(application);
    }

    private _initRuleApplicators()
    {
        return MyPromise.serial(this._ruleRegistry.ruleApplicators, x => {
            return this._initRuleApplicator(x);
        });
    }

    private _initRuleApplicator(applicator: ApplicatorRule)
    {
        this._logger.info("[_initRuleApplicator] %s :: %s...", applicator.namespace, applicator.name);

        if (applicator.spec.disabled) {
            this._logger.info("[_initRuleApplicator] Disabled: %s :: %s", applicator.namespace, applicator.name);
            return;
        }

        const clusterRefName = applicator.spec.clusterRuleRef.name;
        if (!clusterRefName) {
            this._logger.info("[_initRuleApplicator] No clusterRefName: %s :: %s", applicator.namespace, applicator.name);
            return;
        }

        const clusterRuleRuntime = this._clusterRulesDict[clusterRefName];
        if (!clusterRuleRuntime) {
            this._logger.info("[_initRuleApplicator] Missing Cluster Rule: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} not found`);
            return;
        }

        const clusterRule = clusterRuleRuntime.rule as ClusterRule;

        if (!clusterRule.useApplicator) {
            this._logger.info("[_initRuleApplicator] Cluster Rule not using applicators: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} not using applicators`);
            return;
        }
        if (clusterRule.isDisabled) {
            this._logger.info("[_initRuleApplicator] Cluster Rule disabled: %s", clusterRefName);
            return;
        }

        if (!clusterRuleRuntime.compiler) {
            this._logger.info("[_initRuleApplicator] Cluster Rule not compiled: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} not compiled`);
            return;
        }

        if (!clusterRuleRuntime.compiler.isCompiled) {
            this._logger.info("[_initRuleApplicator] Cluster Rule has compilation errors: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} has compilation errors`);
            return;
        }

        const ruleNamespaceInfo = clusterRule.namespaces[applicator.namespace];
        if (clusterRule.onlySelectedNamespaces) {
            if (!ruleNamespaceInfo) {
                return;
            }
        }

        const application: RuleApplicationScope = {
            namespace: applicator.namespace
        };

        const values: RuleOverrideValues = makeValues([applicator.values, ruleNamespaceInfo?.values]);

        clusterRuleRuntime.setupApplication(application, values);
    }


    private _executeRule(rule : RuleRuntime)
    {
        this._logger.info("[_executeRule] %s...", rule.rule.name);
        this._spinner?.update(`Validating rule: ${rule.rule.name}...`);

        return MyPromise.timeout(1)
            .then(() => rule.execute())
            ;
    }

}



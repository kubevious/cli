import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { ApplicatorRule, ClusterRule, CommonRule, NamespaceRule, RuleApplicationScope, RuleObject } from '../registry/types';
import { RuleRegistry } from '../registry/rule-registry';
import { RuleRuntime } from './rule-runtime';
import { RegistryQueryExecutor } from '../query-executor';
import { ExecutionContext } from './execution-context';
import { ManifestPackage } from '../../manifests/manifest-package';
import { RuleEngineReporter } from '../reporting/rule-engine-reporter';
import { ISpinner, spinOperation } from '../../screen/spinner';
import { RuleCompiler } from '../compiler/rule-compiler';
import { RuleDependency, RuleOverrideValues } from '../spec/rule-spec';
import { K8sManifest } from '../../manifests/k8s-manifest';
import { checkKubeviousVersion } from '../../utils/version-checker';
import { RuleEngineResult } from '../../types/rules-result';
import { makeObjectSeverity, makeObjectSeverityFromChildren } from '../../types/result';

export class RulesRuntime
{
    private _logger: ILogger;
    private _ruleRegistry: RuleRegistry;

    private _clusterRules : Record<string, {
        rule: ClusterRule,
        compiler?: RuleCompiler,
    }> = {};
    private _rules : RuleRuntime[] = [];

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

    init()
    {
        return Promise.resolve()
            .then(() => this._checkDependencies())
            .then(() => this._initClusterRules())
            .then(() => this._initRules())
            .then(() => this._initRuleApplicators())
    }

    execute()
    {
        this._logger.info("[execute] Begin. Count: %s", this._rules.length);

        this._spinner = spinOperation('Validating rules...');

        return Promise.serial(this._rules, x => this._executeRule(x))
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
        return Promise.serial(this._ruleRegistry.clusterRules, x => {
            return this._initClusterRule(x);
        });
    }

    private _initClusterRule(clusterRule: ClusterRule)
    {
        this._logger.info("[_initClusterRule] %s...", clusterRule.name);

        if (clusterRule.hasUnmedDependency) {
            this._logger.info("[_initClusterRule] skipping. Has Unmet Dependency.");
        }

        if (clusterRule.isDisabled) {
            this._logger.info("[_initClusterRule] skipping. Disabled: %s", clusterRule.name);

            this._clusterRules[clusterRule.name] = {
                rule: clusterRule
            }
            return;
        }

        return this._prepareRule(clusterRule, clusterRule.manifest)
            .then((compiler) => {
                this._clusterRules[clusterRule.name] = {
                    rule: clusterRule,
                    compiler: compiler,
                }

                this._logger.info("[_initClusterRule] clustered: %s", clusterRule.clustered);
                this._logger.info("[_initClusterRule] useApplicator: %s", clusterRule.useApplicator);

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
        this._logger.info("[_setupClusterRuleApplication] %s...", clusterRule.name);

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

        if (rule.hasUnmedDependency) {
            this._logger.info("[_initRule] skipping. Has Unmet Dependency.");
        }

        if (rule.isDisabled) {
            return;
        }

        return this._prepareRule(rule, rule.manifest)
            .then((compiler) => {
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
            this._logger.info("[_initRuleApplicator] Disabled: %s :: %s", applicator.namespace, applicator.name);
            return;
        }

        const clusterRefName = applicator.spec.clusterRuleRef.name;
        if (!clusterRefName) {
            this._logger.info("[_initRuleApplicator] No clusterRefName: %s :: %s", applicator.namespace, applicator.name);
            return;
        }

        const clusterRuleInfo = this._clusterRules[clusterRefName];
        if (!clusterRuleInfo) {
            this._logger.info("[_initRuleApplicator] Missing Cluster Rule: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} not found`);
            return;
        }
        if (!clusterRuleInfo.rule.useApplicator) {
            this._logger.info("[_initRuleApplicator] Cluster Rule not using applicators: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} not using applicators`);
            return;
        }
        if (clusterRuleInfo.rule.isDisabled) {
            this._logger.info("[_initRuleApplicator] Cluster Rule disabled: %s", clusterRefName);
            return;
        }

        if (!clusterRuleInfo.compiler) {
            this._logger.info("[_initRuleApplicator] Cluster Rule not compiled: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} not compiled`);
            return;
        }

        if (!clusterRuleInfo.compiler.isCompiled) {
            this._logger.info("[_initRuleApplicator] Cluster Rule has compilation errors: %s", clusterRefName);
            applicator.manifest.reportError(`ClusterRule ${clusterRefName} has compilation errors`);
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

    private _prepareRule(ruleObject: RuleObject, manifest: K8sManifest)
    {
        this._logger.info("[_prepareRule] %s :: %s ::%s...", ruleObject.kind, ruleObject.namespace, ruleObject.name)
        const compiler = new RuleCompiler(this._logger, ruleObject, this._targetExecutionContext, this._validatorExecutionContext);
        return compiler.compile()
            .then(() => {
                this._logger.info("[_prepareRule]   - isCompiled: %s", compiler.isCompiled);
                this._logger.info("[_prepareRule]   - hasRuntimeErrors: %s", compiler.hasRuntimeErrors);
                this._logger.info("[_prepareRule]   - errors: ", compiler.ruleErrors);

                for(const error of compiler.ruleErrors)
                {
                    manifest.reportError(error.msg);
                }

                return compiler;
            })
    }


    private _executeRule(rule : RuleRuntime)
    {
        this._logger.info("[_executeRule] %s...", rule.rule.name);
        this._spinner?.update(`Validating rule: ${rule.rule.name}...`);

        return Promise.timeout(1)
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



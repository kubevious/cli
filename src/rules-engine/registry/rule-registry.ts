import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { ApplicatorRule, ClusterRule, NamespaceRule, RuleKind, RuleObject } from './types';
import { RegistryQueryExecutor } from '../query-executor';
import { ClusterRuleK8sSpec, RuleApplicatorK8sSpec, RuleK8sSpec } from '../spec/rule-spec';
import { K8sTargetFilter } from '../target/k8s-target-builder';
import { spinOperation } from '../../screen/spinner';
import { K8sManifest } from '../../manifests/k8s-manifest';

const KUBEVIOUS_API_NAME = 'kubevious.io';
const KUBEVIOUS_KIND_CLUSTER_RULE = 'ClusterRule';
const KUBEVIOUS_KIND_RULE = 'Rule';
const KUBEVIOUS_KIND_APPLICATOR_RULE = 'RuleApplicator';

export interface RuleRegistryLoadOptions {
    namespaces : string[],
    onlySelectedNamespaces: boolean,
    skipClusterScope: boolean,
}

export class RuleRegistry
{
    private _logger: ILogger;

    private _clusterRules : Record<string, ClusterRule> = {};
    private _rules : Record<string, NamespaceRule> = {};
    private _ruleApplicators : Record<string, ApplicatorRule> = {};

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('RuleRegistry');
    }

    get clusterRules() {
        return _.values(this._clusterRules);
    }

    get rules() {
        return _.values(this._rules);
    }

    get ruleApplicators() {
        return _.values(this._ruleApplicators);
    }

    findClusterRule(name: string) : RuleObject | null {
        return this._clusterRules[name] ?? null;
    }

    loadLocally(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        this._logger.info("[loadLocally] options: ", options);

        const spinner = spinOperation("Populating local RulesLibrary...");

        this._loadClusterRules(registry, options);
        this._loadNsRules(registry, options);
        this._loadApplicatorRules(registry, options);

        spinner.complete("RulesLibrary locally populated.")
    }

    loadRemotely(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        this._logger.info("[loadRemotely] options: ", options);

        const spinner = spinOperation("Populating RulesLibrary From K8s...");

        this._loadClusterRules(registry, options);
        this._loadNsRules(registry, options);
        this._loadApplicatorRules(registry, options);

        spinner.complete("RulesLibrary populated from K8s.")
    }

    private _loadClusterRules(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        if (options.skipClusterScope) {
            return;
        }

        const spinner = spinOperation("Loading ClusterRules...", 2);

        const query: K8sTargetFilter = {
            isApiVersion: false,
            apiOrNone: KUBEVIOUS_API_NAME,
            kind: KUBEVIOUS_KIND_CLUSTER_RULE,
            isAllNamespaces: true,
        };

        const results = registry.query(query);
        for(const manifest of results)
        {
            this._loadClusterRule(manifest);
        }

        spinner.complete("ClusterRules loaded.")
    }

    private _loadClusterRule(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        if (!name) {
            return;
        }

        this._logger.info("[_loadClusterRule] %s...", name);

        const spec = (config.spec as ClusterRuleK8sSpec) ?? {};
        spec.disabled = spec.disabled ?? false;
        spec.values = spec.values ?? {};
        spec.application = spec.application ?? {};
        spec.application.clustered = spec.application.clustered ?? false;
        spec.application.useApplicator = spec.application.useApplicator ?? false;
        spec.application.onlySelectedNamespaces = spec.application.onlySelectedNamespaces ?? false;
        spec.application.namespaces = spec.application.namespaces ?? [];

        const clustered = spec.application.clustered;

        this._clusterRules[name] = {
            manifest: manifest,
            source: manifest.source.source,
            kind: RuleKind.ClusterRule,
            name: name,
            target: spec.target,
            script: spec.rule,
            values: spec.values,
            spec: spec,

            clustered: clustered,
            useApplicator: !clustered && spec.application.useApplicator,
            onlySelectedNamespaces: !clustered && spec.application.onlySelectedNamespaces,
            namespaces: 
                clustered ? {} :
                _.makeDict(spec.application.namespaces, x => x.name, x => ({ values: x.values ?? {} }))
        };

    }

    private _loadNsRules(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        this._logger.info("[_loadNsRules] ", options);

        const spinner = spinOperation("Loading Rules...", 2);

        if (options.onlySelectedNamespaces)
        {
            for(const namespace of options.namespaces)
            {
                spinner.update(`Loading Rules from ${namespace}...`);

                const query: K8sTargetFilter = {
                    isApiVersion: false,
                    apiOrNone: KUBEVIOUS_API_NAME,
                    kind: KUBEVIOUS_KIND_RULE,
                    namespace: namespace,
                };
    
                this._logger.info("[_loadNsRules] Running namespace: %s query...", namespace);
                const results = registry.query(query);
                this._logger.info("[_loadNsRules] count: %s", results.length);

                for(const result of results)
                {
                    this._loadNsRule(result);
                }
            }
        }
        else
        {
            const query: K8sTargetFilter = {
                isApiVersion: false,
                apiOrNone: KUBEVIOUS_API_NAME,
                kind: KUBEVIOUS_KIND_RULE,
                isAllNamespaces: true,
            };

            this._logger.info("[_loadNsRules] Running global query...");
            const results = registry.query(query);
            this._logger.info("[_loadNsRules] count: %s", results.length);

            for(const result of results)
            {
                this._loadNsRule(result);
            }
        }

        spinner.complete("Rules loaded.")
    }

    private _loadNsRule(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        const namespace = config.metadata?.namespace ?? 'default';

        this._logger.info("[_loadNsRule] %s :: %s...", namespace, name);
        
        const spec = (config.spec as RuleK8sSpec) ?? {};
        spec.disabled = spec.disabled ?? false;
        spec.values = spec.values ?? {};

        const targetScript = spec.target; 
        const ruleScript = spec.rule; 

        if (!name) {
            return;
        }

        this._rules[manifest.idKey] = {
            manifest: manifest,
            source: manifest.source.source,
            kind: RuleKind.Rule,
            namespace: namespace,
            name: name,
            application: {
                namespace: namespace
            },
            target: targetScript,
            script: ruleScript,
            values: spec.values,
            spec: spec
        };
    }

    private _loadApplicatorRules(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        const spinner = spinOperation("Loading RuleApplicators...", 2);

        if (options.onlySelectedNamespaces)
        {
            for(const namespace of options.namespaces)
            {
                spinner.update(`Loading RuleApplicators from ${namespace}...`);

                const query: K8sTargetFilter = {
                    isApiVersion: false,
                    apiOrNone: KUBEVIOUS_API_NAME,
                    kind: KUBEVIOUS_KIND_APPLICATOR_RULE,
                    namespace: namespace
                };
        
                const results = registry.query(query);
                for(const result of results)
                {
                    this._loadApplicatorRule(result);
                }
            }
        }
        else
        {
            const query: K8sTargetFilter = {
                isApiVersion: false,
                apiOrNone: KUBEVIOUS_API_NAME,
                kind: KUBEVIOUS_KIND_APPLICATOR_RULE,
                isAllNamespaces: true,
            };
    
            const results = registry.query(query);
            for(const result of results)
            {
                this._loadApplicatorRule(result);
            }
        }

        spinner.complete("RuleApplicators loaded");
    }

    private _loadApplicatorRule(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        const namespace = config.metadata?.namespace ?? 'default';
        
        this._logger.info("[_loadApplicatorRule] %s :: %s...", namespace, name);

        const spec = (config.spec as RuleApplicatorK8sSpec) ?? {};
        spec.disabled = spec.disabled ?? false;
        spec.values = spec.values ?? {};

        if (!name) {
            return;
        }

        this._ruleApplicators[manifest.idKey] = {
            manifest: manifest,
            source: manifest.source.source,
            kind: RuleKind.RuleApplicator,
            namespace: namespace,
            name: name,
            application: {
                namespace: namespace
            },
            values: spec.values,
            spec: spec
        };
    }

}

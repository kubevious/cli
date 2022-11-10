import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { ApplicatorRule, ClusterRule, NamespaceRule, RuleKind, RuleObject } from './types/rules';
import { K8sManifest } from '../manifests/manifest-package';
import { RegistryQueryExecutor } from './query-executor';
import { ClusterRuleK8sSpec, RuleApplicatorK8sSpec, RuleK8sSpec } from './spec/rule-spec';
import { K8sTargetFilter } from './target/k8s-target-builder';

const KUBEVIOUS_API_NAME = 'kubevious.io';
const KUBEVIOUS_KIND_CLUSTER_RULE = 'ClusterRule';
const KUBEVIOUS_KIND_RULE = 'Rule';
const KUBEVIOUS_KIND_APPLICATOR_RULE = 'RuleApplicator';

export class RuleRegistry
{
    private _logger: ILogger;

    private _clusterRules : Record<string, ClusterRule> = {};
    private _rules : NamespaceRule[] = [];
    private _ruleApplicators : ApplicatorRule[] = [];

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('RuleRegistry');
    }

    get clusterRules() {
        return _.values(this._clusterRules);
    }

    get rules() {
        return this._rules;
    }

    get ruleApplicators() {
        return this._ruleApplicators;
    }

    findClusterRule(name: string) : RuleObject | null {
        return this._clusterRules[name] ?? null;
    }

    loadFromRegistry(registry: RegistryQueryExecutor)
    {
        this._loadClusterRules(registry);
        this._loadNsRules(registry);
        this._loadApplicatorRules(registry);
    }

    private _loadClusterRules(registry: RegistryQueryExecutor)
    {
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
    }

    private _loadClusterRule(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        if (!name) {
            return;
        }

        const spec = (config.spec as ClusterRuleK8sSpec) ?? {};
        spec.disabled = spec.disabled ?? false;
        spec.values = spec.values ?? {};
        spec.application = spec.application ?? {};
        spec.application.useApplicator = spec.application.useApplicator ?? false;
        spec.application.onlySelectedNamespaces = spec.application.onlySelectedNamespaces ?? false;
        spec.application.namespaces = spec.application.namespaces ?? [];

        const targetScript = spec.target; 
        const ruleScript = spec.rule; 

        this._clusterRules[name] = {
            source: manifest.source.source,
            kind: RuleKind.ClusterRule,
            name: name,
            target: targetScript,
            script: ruleScript,
            values: spec.values,
            spec: spec,

            useApplicator: spec.application.useApplicator,
            onlySelectedNamespaces: spec.application.onlySelectedNamespaces,
            namespaces: _.makeDict(spec.application.namespaces, x => x.name, x => ({ values: x.values ?? {} }))
        };

    }

    private _loadNsRules(registry: RegistryQueryExecutor)
    {
        const query: K8sTargetFilter = {
            isApiVersion: false,
            apiOrNone: KUBEVIOUS_API_NAME,
            kind: KUBEVIOUS_KIND_RULE,
            isAllNamespaces: true,
        };

        const results = registry.query(query);
        for(const result of results)
        {
            this._loadNsRule(result);
        }
    }

    private _loadNsRule(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        const namespace = config.metadata?.namespace ?? 'default';
        
        const spec = (config.spec as RuleK8sSpec) ?? {};
        spec.disabled = spec.disabled ?? false;
        spec.values = spec.values ?? {};

        const targetScript = spec.target; 
        const ruleScript = spec.rule; 

        if (!name) {
            return;
        }

        this._rules.push({
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
        });
    }


    private _loadApplicatorRules(registry: RegistryQueryExecutor)
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

    private _loadApplicatorRule(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        const namespace = config.metadata?.namespace ?? 'default';
        
        const spec = (config.spec as RuleApplicatorK8sSpec) ?? {};
        spec.disabled = spec.disabled ?? false;
        spec.values = spec.values ?? {};

        if (!name) {
            return;
        }

        this._ruleApplicators.push({
            source: manifest.source.source,
            kind: RuleKind.RuleApplicator,
            namespace: namespace,
            name: name,
            application: {
                namespace: namespace
            },
            values: spec.values,
            spec: spec
        });
    }

}

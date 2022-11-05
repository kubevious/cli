import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { RuleKind, RuleObject } from '../../types/rules';
import { K8sManifest } from '../manifest-package';
import { RegistryQueryExecutor } from './query-executor';
import { K8sTargetFilter } from './target/k8s-target-builder';

const KUBEVIOUS_API_NAME = 'kubevious.io';
const KUBEVIOUS_KIND_CLUSTER_RULE = 'ClusterRule';
const KUBEVIOUS_KIND_RULE = 'Rule';

export class RuleRegistry
{
    private _logger: ILogger;
    private _rules : RuleObject[] = [];

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('RuleRegistry');
    }

    get rules() {
        return this._rules;
    }

    loadFromRegistry(registry: RegistryQueryExecutor)
    {
        this._loadClusterRules(registry);
        this._loadNsRules(registry);
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
        const targetScript = config.spec?.target; 
        const ruleScript = config.spec?.rule; 

        if (!name) {
            return;
        }

        this._loadRuleObject({
            source: manifest.source.source,
            kind: RuleKind.ClusterRule,
            name: name,
            target: targetScript,
            script: ruleScript,
            values: config.spec?.values ?? {}
        });
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
        const targetScript = config.spec?.target; 
        const ruleScript = config.spec?.rule; 

        if (!name) {
            return;
        }

        this._loadRuleObject({
            source: manifest.source.source,
            kind: RuleKind.Rule,
            namespace: namespace,
            name: name,
            application: {
                namespace: namespace
            },
            target: targetScript,
            script: ruleScript,
            values: config.spec?.values ?? {}
        });
    }

    private _loadRuleObject(rule : RuleObject)
    {
        this._rules.push(rule);
    }

}

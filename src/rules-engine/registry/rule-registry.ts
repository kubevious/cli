import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { ApplicatorRule, ClusterRule, NamespaceRule, RuleKind, RuleObject } from './types';
import { RegistryQueryExecutor } from '../query-executor';
import { ClusterRuleK8sSpec, LibraryK8sSpec, LibraryRuleRefK8sSpec, RuleApplicatorK8sSpec, RuleK8sSpec } from '../spec/rule-spec';
import { K8sTargetFilter } from '../query-spec/k8s-target-query';
import { spinOperation } from '../../screen/spinner';
import { K8sManifest } from '../../manifests/k8s-manifest';
import { ManifetsLoader } from '../../manifests/manifests-loader';
import { ManifestPackage } from '../../manifests/manifest-package';
import { KubeviousKinds, KUBEVIOUS_API_NAME } from '../../types/kubevious';


export interface RuleRegistryLoadOptions {
    namespaces : string[],
    onlySelectedNamespaces: boolean,
    skipClusterScope: boolean,
    skipLibraries: boolean
}

export class RuleRegistry
{
    private _logger: ILogger;

    private _clusterRules : Record<string, ClusterRule> = {};
    private _rules : Record<string, NamespaceRule> = {};
    private _ruleApplicators : Record<string, ApplicatorRule> = {};

    private _manifestPackage : ManifestPackage;
    private _manifestsLoader : ManifetsLoader;

    constructor(logger: ILogger, manifestPackage : ManifestPackage)
    {
        this._logger = logger.sublogger('RuleRegistry');

        this._manifestPackage = manifestPackage; //new ManifestPackage(logger);
        this._manifestsLoader = new ManifetsLoader(logger, this._manifestPackage);
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

    async loadLocally(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        this._logger.info("[loadLocally] options: ", options);

        const spinner = spinOperation("Populating local RulesLibrary...");

        await this._loadRegistry(registry, options);

        spinner.complete("RulesLibrary locally populated.")
    }

    async loadRemotely(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        this._logger.info("[loadRemotely] options: ", options);

        const spinner = spinOperation("Populating RulesLibrary From K8s...");

        await this._loadRegistry(registry, options);

        spinner.complete("RulesLibrary populated from K8s.")
    }
    
    private async _loadRegistry(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        await this._loadLibraries(registry, options);
        await this._loadClusterRules(registry, options);
        await this._loadNsRules(registry, options);
        await this._loadApplicatorRules(registry, options);
    }

    private async _loadClusterRules(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        if (options.skipClusterScope) {
            return;
        }

        const spinner = spinOperation("Loading ClusterRules...", 2);

        const query: K8sTargetFilter = {
            isApiVersion: false,
            apiOrNone: KUBEVIOUS_API_NAME,
            kind: KubeviousKinds.ClusterRule,
            isAllNamespaces: true,
        };

        const results = registry.query(query);
        for(const manifest of results)
        {
            await this._loadClusterRule(manifest);
        }

        spinner.complete("ClusterRules loaded.")
    }

    private async _loadClusterRule(manifest: K8sManifest)
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
            cache: spec.cache,
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

    private async _loadNsRules(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
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
                    kind: KubeviousKinds.Rule,
                    namespace: namespace,
                };
    
                this._logger.info("[_loadNsRules] Running namespace: %s query...", namespace);
                const results = registry.query(query);
                this._logger.info("[_loadNsRules] count: %s", results.length);

                for(const result of results)
                {
                    await this._loadNsRule(result);
                }
            }
        }
        else
        {
            const query: K8sTargetFilter = {
                isApiVersion: false,
                apiOrNone: KUBEVIOUS_API_NAME,
                kind: KubeviousKinds.Rule,
                isAllNamespaces: true,
            };

            this._logger.info("[_loadNsRules] Running global query...");
            const results = registry.query(query);
            this._logger.info("[_loadNsRules] count: %s", results.length);

            for(const result of results)
            {
                await this._loadNsRule(result);
            }
        }

        spinner.complete("Rules loaded.")
    }

    private async _loadNsRule(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        const namespace = config.metadata?.namespace ?? 'default';

        this._logger.info("[_loadNsRule] %s :: %s...", namespace, name);
        
        const spec = (config.spec as RuleK8sSpec) ?? {};
        spec.disabled = spec.disabled ?? false;
        spec.values = spec.values ?? {};

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
            target: spec.target,
            cache: spec.cache,
            script: spec.rule,
            values: spec.values,
            spec: spec
        };
    }

    private async _loadApplicatorRules(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
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
                    kind: KubeviousKinds.RuleApplicator,
                    namespace: namespace
                };
        
                const results = registry.query(query);
                for(const result of results)
                {
                    await this._loadApplicatorRule(result);
                }
            }
        }
        else
        {
            const query: K8sTargetFilter = {
                isApiVersion: false,
                apiOrNone: KUBEVIOUS_API_NAME,
                kind: KubeviousKinds.RuleApplicator,
                isAllNamespaces: true,
            };
    
            const results = registry.query(query);
            for(const result of results)
            {
                await this._loadApplicatorRule(result);
            }
        }

        spinner.complete("RuleApplicators loaded");
    }

    private async _loadApplicatorRule(manifest: K8sManifest)
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

    private async _loadLibraries(registry: RegistryQueryExecutor, options: RuleRegistryLoadOptions)
    {
        if (options.skipLibraries) {
            return;
        }
        
        const spinner = spinOperation("Loading Libraries...", 2);
        const query: K8sTargetFilter = {
            isApiVersion: false,
            apiOrNone: KUBEVIOUS_API_NAME,
            kind: KubeviousKinds.Library,
            isAllNamespaces: true,
        };

        const results = registry.query(query);

        for(const manifest of results)
        {
            await this._loadLibrary(manifest);
        }

        spinner.complete("Libraries loaded.")
    }

    private async _loadLibrary(manifest: K8sManifest)
    {
        const config = manifest.config;
        
        const name = config.metadata?.name;
        
        this._logger.info("[_loadLibrary] %s ...", name);

        const spec = (config.spec as LibraryK8sSpec) ?? {};

        const ruleRefs = spec.rules ?? [];
        
        for(const ruleRef of ruleRefs)
        {
            await this._loadLibraryRule(manifest, ruleRef);
        }
    }

    private async _loadLibraryRule(library: K8sManifest, ruleRef: LibraryRuleRefK8sSpec)
    {
        const ruleManifests = await this._manifestsLoader.loadSingle(ruleRef.path, library.source);

        for(const ruleManifest of ruleManifests)
        {
            await this._loadClusterRule(ruleManifest);
        }
    }

}

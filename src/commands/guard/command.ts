import _ from 'the-lodash';
import { logger } from '../../logger';

import { GuardCommandData, GuardCommandOptions } from './types';
import { LocalRegistryPopulator } from '../../registry/local-registry-populator';
import { RuleRegistry, RuleRegistryLoadOptions } from '../../rules-engine/registry/rule-registry';
import { RulesRuntime } from '../../rules-engine/execution/rules-runtime';

import { command as lintCommand, determineLintSuccess, massageLintOptions } from '../lint/command';
import { RemoteK8sRegistry } from '../../registry/remote-k8s-registry';
import { RegistryQueryExecutor } from '../../rules-engine/query-executor';
import { CombinedK8sRegistry } from '../../registry/combined-k8s-registry';
import { CachedK8sRegistry } from '../../registry/cached-k8s-registry';

const COMMUNITY_RULES_PATH = 'https://raw.githubusercontent.com/kubevious/rules-library/main/index.yaml';

const myLogger = logger.sublogger('GuardCommand');

export async function command(path: string[], options: GuardCommandOptions) : Promise<GuardCommandData>
{
    if (!options.skipCommunityRules) {
        path.push(COMMUNITY_RULES_PATH);
    }

    logger.info("[PATH] ", path);

    const lintResult = await lintCommand(path, options);

    const manifestPackage = lintResult.manifestPackage;
    const manifestLoader = lintResult.manifestLoader;
    const k8sConnector = lintResult.k8sConnector;

    const registryPopulator = new LocalRegistryPopulator(logger,
                                                         lintResult.k8sSchemaInfo.k8sJsonSchema!,
                                                         manifestPackage);
    registryPopulator.process();

    const localK8sRegistry = registryPopulator.localK8sRegistry;
    // await processor.localK8sRegistry.debugOutputToDir(logger, 'local-k8s-registry');

    let remoteRegistry: RegistryQueryExecutor | undefined;
    if (k8sConnector.isUsed)
    {
        const myRemoteRegistry = new RemoteK8sRegistry(logger, k8sConnector);
        remoteRegistry = new CachedK8sRegistry(logger, myRemoteRegistry);
    }

    const ruleRegistry = new RuleRegistry(logger, manifestPackage, manifestLoader);
    if (!options.skipRemoteRules)
    {
        if (remoteRegistry)
        {
            const ruleRegistryLoadOptions : RuleRegistryLoadOptions = {
                skipClusterScope: options.skipClusterScope,
                onlySelectedNamespaces: options.areNamespacesSpecified,
                namespaces:
                    options.areNamespacesSpecified 
                        ? options.namespaces
                        : manifestPackage.namespaces,
                skipLibraries: false
            }

            await ruleRegistry.loadRemotely(remoteRegistry, ruleRegistryLoadOptions);
        }
    }

    if (!options.skipLocalRules)
    {
        const ruleRegistryLoadOptions : RuleRegistryLoadOptions = {
            skipClusterScope: options.skipClusterScope,
            onlySelectedNamespaces: true,
            namespaces:
                options.areNamespacesSpecified 
                    ? options.namespaces
                    : manifestPackage.namespaces,
            skipLibraries: false
        }

        await ruleRegistry.loadLocally(localK8sRegistry, ruleRegistryLoadOptions);
    }

    let combinedRegistry : RegistryQueryExecutor = localK8sRegistry;
    if (remoteRegistry)
    {
        combinedRegistry = new CombinedK8sRegistry(logger, [localK8sRegistry, remoteRegistry]);
    }

    let targetQueryRegistry : RegistryQueryExecutor = localK8sRegistry;
    if (options.includeRemoteTargets) {
        targetQueryRegistry = combinedRegistry;
    }

    const validatorQueryRegistry : RegistryQueryExecutor = combinedRegistry;

    let executionNamespaces : string[] = [];
    if (options.areNamespacesSpecified) {
        executionNamespaces = options.namespaces;
    } else {
        executionNamespaces = manifestPackage.namespaces;
    }

    const rulesRuntime = new RulesRuntime(logger,
                                          ruleRegistry,
                                          manifestPackage,
                                          executionNamespaces,
                                          targetQueryRegistry,
                                          validatorQueryRegistry);
    await rulesRuntime.init();
    await rulesRuntime.execute();

    let ruleSuccess = true;
    for(const rule of rulesRuntime.rules)
    {
        for(const violation of rule.violations)
        {
            if (violation.hasErrors)
            {
                ruleSuccess = false;
            }
        }
    }

    lintResult.success = determineLintSuccess(manifestPackage);

    const success = lintResult.success && ruleSuccess; 

    myLogger.info("Success: %s", success);
    myLogger.info("RuleSuccess: %s", ruleSuccess);
    myLogger.info("LintResult.success: %s", lintResult.success);

    return {
        success,
        ruleSuccess,
        manifestPackage: manifestPackage,
        k8sSchemaInfo: lintResult.k8sSchemaInfo,
        rulesRuntime,
        localK8sRegistry: localK8sRegistry,
        lintCommandData: lintResult
    } 
}

export function massageGuardOptions(options: Partial<GuardCommandOptions>) : GuardCommandOptions
{
    let areNamespacesSpecified = false;
    let namespaces: string[] = [];
    if (options.namespace) {
        areNamespacesSpecified = true;
        namespaces = [options.namespace!];
    } else {
        if (!_.isUndefined(options.namespaces)) {

            if (_.isBoolean(options.namespaces)) {
                areNamespacesSpecified = true;
                namespaces = [];
            } else {
                areNamespacesSpecified = true;
                namespaces = options.namespaces!;
            }
        }
    }

    return {
        ...massageLintOptions(options),
        skipCommunityRules: options.skipCommunityRules ?? false,
        includeRemoteTargets: options.includeRemoteTargets ?? false,
        skipLocalRules: options.skipLocalRules ?? false,
        skipRemoteRules: options.skipRemoteRules ?? false,
        areNamespacesSpecified: areNamespacesSpecified,
        namespace: undefined,
        namespaces: namespaces,
        skipClusterScope: options.skipClusterScope ?? false,
        skipRuleLibraries: false,
    }
}

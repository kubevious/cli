import _ from 'the-lodash';
import { logger } from '../../logger';

import { GuardCommandData, GuardCommandOptions } from './types';
import { LocalRegistryPopulator } from '../../registry/local-registry-populator';
import { RuleRegistry, RuleRegistryLoadOptions } from '../../rules-engine/registry/rule-registry';
import { RulesRuntime } from '../../rules-engine/execution/rules-runtime';

import { command as lintCommand, massageLintOptions } from '../lint/command';
import { RemoteK8sRegistry } from '../../registry/remote-k8s-registry';
import { RegistryQueryExecutor } from '../../rules-engine/query-executor';
import { CombinedRegistry } from '../../registry/combined-registry';

export async function command(path: string[], options: GuardCommandOptions) : Promise<GuardCommandData>
{
    logger.info("[PATH] ", path);

    // logger.info("[areNamespacesSpecified] %s", options.areNamespacesSpecified);
    // logger.info("[NAMESPACES] ", options.namespaces);
    // throw new Error("XXX");

    const lintResult = await lintCommand(path, options);

    const manifestPackage = lintResult.manifestPackage;

    const k8sConnector = lintResult.k8sConnector;

    const registryPopulator = new LocalRegistryPopulator(logger,
                                                         lintResult.k8sSchemaInfo.k8sJsonSchema!,
                                                         manifestPackage);
    registryPopulator.process();

    const localK8sRegistry = registryPopulator.localK8sRegistry;
    // await processor.localK8sRegistry.debugOutputToDir(logger, 'local-k8s-registry');
    // await processor.localRegistryAccessor.debugOutputToDir(logger, 'local-logic-registry');


    let remoteRegistry: RegistryQueryExecutor | undefined;
    if (k8sConnector.isUsed)
    {
        remoteRegistry = new RemoteK8sRegistry(logger, k8sConnector);
    }

    const ruleRegistry = new RuleRegistry(logger);
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
        }

        await ruleRegistry.loadLocally(localK8sRegistry, ruleRegistryLoadOptions);
    }

    let combinedRegistry : RegistryQueryExecutor = localK8sRegistry;
    if (remoteRegistry)
    {
        combinedRegistry = new CombinedRegistry(logger, [localK8sRegistry, remoteRegistry]);
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

    return {
        manifestPackage: manifestPackage,
        k8sSchemaInfo: lintResult.k8sSchemaInfo,
        rulesRuntime
    } 
}

export function massageGuardOptions(options: Partial<GuardCommandOptions>) : GuardCommandOptions
{
    // logger.info("XXXXX: ", options.namespaces);
    // throw new Error("KUKU");

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
        
        includeRemoteTargets: options.includeRemoteTargets ?? false,
        skipLocalRules: options.skipLocalRules ?? false,
        skipRemoteRules: options.skipRemoteRules ?? false,
        areNamespacesSpecified: areNamespacesSpecified,
        namespace: undefined,
        namespaces: namespaces,
        skipClusterScope: options.skipClusterScope ?? false,
    }
}

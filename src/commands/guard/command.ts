import _ from 'the-lodash';
import { logger } from '../../logger';

import { GuardCommandData, GuardCommandOptions } from './types';
import { LocalRegistryPopulator } from '../../registry/local-registry-populator';
import { RuleRegistry } from '../../rules-engine/registry/rule-registry';
import { RulesRuntime } from '../../rules-engine/execution/rules-runtime';

import { command as lintCommand, massageLintOptions } from '../lint/command';
import { RemoteK8sRegistry } from '../../registry/remote-k8s-registry';
import { RegistryQueryExecutor } from '../../rules-engine/query-executor';
import { CombinedRegistry } from '../../registry/combined-registry';

export async function command(path: string[], options: GuardCommandOptions) : Promise<GuardCommandData>
{
    logger.info("[PATH] ", path);

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
            await ruleRegistry.loadRemotely(remoteRegistry, manifestPackage.namespaces);
        }
    }
    if (!options.skipLocalRules)
    {
        await ruleRegistry.loadLocally(localK8sRegistry);
    }


    let finalRegistry : RegistryQueryExecutor = localK8sRegistry;
    if (remoteRegistry)
    {
        finalRegistry = new CombinedRegistry(logger, [finalRegistry, remoteRegistry]);
    }


    const rulesRuntime = new RulesRuntime(logger,
                                          ruleRegistry,
                                          finalRegistry,
                                          manifestPackage);
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
    return {
        ...massageLintOptions(options),
        
        skipLocalRules: options.skipLocalRules ?? false,
        skipRemoteRules: options.skipRemoteRules ?? false,
    }
}

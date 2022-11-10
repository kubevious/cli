import _ from 'the-lodash';
import { logger } from '../../logger';

import { GuardCommandData, GuardCommandOptions } from './types';
import { LocalRegistryPopulator } from '../../registry/local-registry-populator';
import { RuleRegistry } from '../../rules-engine/rule-registry';
import { RulesRuntime } from '../../rules-engine/rules-runtime';

import { command as lintCommand, massageLintOptions } from '../lint/command';
import { KubernetesClient } from 'k8s-super-client/dist';
import { K8sClusterConnector } from '../../k8s-connector/k8s-cluster-connector';
import { RemoteK8sRegistry } from '../../registry/remote-k8s-registry';

export async function command(path: string[], options: GuardCommandOptions) : Promise<GuardCommandData>
{
    logger.info("[PATH] ", path);

    const lintResult = await lintCommand(path, options);

    const k8sConnector = lintResult.k8sConnector;

    const registryPopulator = new LocalRegistryPopulator(logger,
                                                         lintResult.k8sSchemaInfo.k8sJsonSchema!,
                                                         lintResult.manifestPackage);
    registryPopulator.process();

    const localK8sRegistry = registryPopulator.localK8sRegistry;
    // await processor.localK8sRegistry.debugOutputToDir(logger, 'local-k8s-registry');
    // await processor.localRegistryAccessor.debugOutputToDir(logger, 'local-logic-registry');

    const remoteRegistry = new RemoteK8sRegistry(logger, k8sConnector);
    await remoteRegistry.test();

    const ruleRegistry = new RuleRegistry(logger);
    await ruleRegistry.loadFromRegistry(remoteRegistry);
    // await ruleRegistry.loadFromRegistry(localK8sRegistry);

    throw new Error("XXXX");

    if (k8sConnector.isUsed) {
        await test(k8sConnector);
    }


    const rulesRuntime = new RulesRuntime(logger, ruleRegistry, localK8sRegistry, lintResult.manifestPackage);
    await rulesRuntime.init();
    await rulesRuntime.execute();

    return {
        manifestPackage: lintResult.manifestPackage,
        k8sSchemaInfo: lintResult.k8sSchemaInfo,
        rulesRuntime
    } 
}

export function massageGuardOptions(options: Partial<GuardCommandOptions>) : GuardCommandOptions
{
    return {
        ...massageLintOptions(options)
    }
}

function test(k8sConnector: K8sClusterConnector)
{
    const registry = new RemoteK8sRegistry(logger, k8sConnector)
}
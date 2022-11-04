import _ from 'the-lodash';
import { logger } from '../../logger';

import { GuardCommandData } from './types';
import { LocalRegistryPopulator } from '../../tools/local-registry-populator';
import { RuleRegistry } from '../../tools/rules-engine/rule-registry';
import { RulesRuntime } from '../../tools/rules-engine/rules-runtime';

import { command as lintCommand } from '../lint/command';

export async function command(path: string[], options: any) : Promise<GuardCommandData>
{
    logger.info("[PATH] ", path);

    const lintResult = await lintCommand(path, options);

    const registryPopulator = new LocalRegistryPopulator(logger,
                                                         lintResult.k8sSchemaInfo.k8sJsonSchema!,
                                                         lintResult.manifestPackage);
    registryPopulator.process();
    // await processor.localK8sRegistry.debugOutputToDir(logger, 'local-k8s-registry');
    // await processor.localRegistryAccessor.debugOutputToDir(logger, 'local-logic-registry');

    const ruleRegistry = new RuleRegistry(logger);
    await ruleRegistry.init();

    const rulesRuntime = new RulesRuntime(logger, ruleRegistry, registryPopulator.localK8sRegistry, lintResult.manifestPackage);
    await rulesRuntime.init();
    await rulesRuntime.execute();

    return {
        manifestPackage: lintResult.manifestPackage,
        k8sSchemaInfo: lintResult.k8sSchemaInfo,
        rulesRuntime
    } 
}
import _ from 'the-lodash';
import { logger } from '../../logger';

import { IndexLibraryCommandData, IndexLibraryCommandOptions } from './types';

import { command as guardCommand } from '../guard/command';
import { KubeviousKinds, KUBEVIOUS_API_NAME } from '../../types/kubevious';

export async function command(dir: string, options: IndexLibraryCommandOptions) : Promise<IndexLibraryCommandData>
{
    logger.info("[Dir] ", dir);

    const guardResult = await guardCommand([dir], {
        ignoreUnknown: true,
        ignoreNonK8s: true,
        stream: false,
        skipApplyCrds: true,
        liveK8s: false,

        includeRemoteTargets: false,
        skipLocalRules: false,
        skipRemoteRules: true,
    
        areNamespacesSpecified: false,
        namespaces: [],
        skipClusterScope: false,
        skipCommunityRules: true,
        skipRuleLibraries: true,
    });

    const manifestPackage = guardResult.manifestPackage;

    const rules = guardResult.localK8sRegistry.query({
        isApiVersion: false,
        apiOrNone: KUBEVIOUS_API_NAME,
        kind: KubeviousKinds.ClusterRule,
        isAllNamespaces: true,
    });

    for(const rule of rules)
    {
        logger.info("LIBRARY RULE: %s", rule.idKey);
    }

    return {
        manifestPackage,
        guardCommandData: guardResult,

        libraryDir: dir,
        rules,
    }
}

export function massageIndexOptions(options: Partial<IndexLibraryCommandOptions>) : IndexLibraryCommandOptions
{
    return {
    }
}

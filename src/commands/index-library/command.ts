import _ from 'the-lodash';
import { logger } from '../../logger';
import Path from 'path';
import { promises as fs } from 'fs';

import { IndexLibraryCommandData, IndexLibraryCommandOptions } from './types';

import { command as guardCommand } from '../guard/command';
import { KubeviousKinds, KUBEVIOUS_API_NAME, KUBEVIOUS_API_VERSION } from '../../types/kubevious';
import { LibraryK8sObject } from '../../rules-engine/spec/rule-spec';
import YAML from 'yaml';
import { makeRelativePath } from '../../utils/path';

export async function command(dir: string, options: IndexLibraryCommandOptions) : Promise<IndexLibraryCommandData>
{
    logger.info("[Dir] ", dir);

    const guardResult = await guardCommand([dir], {
        ignoreUnknown: true,
        ignoreNonK8s: true,
        stream: false,
        skipApplyCrds: false,
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

    const libraryFilePath = Path.join(dir, 'index.yaml');
    const libraryObject : LibraryK8sObject = {
        apiVersion: `${KUBEVIOUS_API_NAME}/${KUBEVIOUS_API_VERSION}`,
        kind: KubeviousKinds.Library,
        metadata: {
            name: 'community'
        },
        spec: {
            rules: []
        }
    }
    
    const rules = guardResult.localK8sRegistry.query({
        isApiVersion: false,
        apiOrNone: KUBEVIOUS_API_NAME,
        kind: KubeviousKinds.ClusterRule,
        isAllNamespaces: true,
    });

    for(const rule of rules)
    {
        logger.info("LIBRARY RULE: %s", rule.idKey);
        const rulePath = makeRelativePath(rule.source.source.path, dir);
        
        libraryObject.spec.rules.push({
            name: rule.id.name!,
            path: rulePath
        });
    }

    libraryObject.spec.rules = _.orderBy(libraryObject.spec.rules, [x => x.name, x => x.path]);

    if (guardResult.success)
    {
        await fs.writeFile(libraryFilePath,
            YAML.stringify(libraryObject, {
                toStringDefaults: {
                    indent: 2,
                    indentSeq: false
                }
            }));
    }

    const success = guardResult.success;

    return {
        success,
        manifestPackage,
        guardCommandData: guardResult,

        libraryDir: dir,
        libraryPath: libraryFilePath,
        libraryObject,
        rules,
    }
}

export function massageIndexOptions(options: Partial<IndexLibraryCommandOptions>) : IndexLibraryCommandOptions
{
    return {
    }
}

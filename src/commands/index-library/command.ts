import _ from 'the-lodash';
import { logger } from '../../logger';
import Path from 'path';
import { promises as fs, existsSync } from 'fs';

import { IndexLibraryCommandData, IndexLibraryCommandOptions, LibraryResult, LibraryResultCategory } from './types';

import { command as guardCommand } from '../guard/command';
import { KubeviousKinds, KUBEVIOUS_API_NAME, KUBEVIOUS_API_VERSION } from '../../types/kubevious';
import { ClusterRuleK8sSpec, LibraryK8sObject } from '../../rules-engine/spec/rule-spec';
import YAML from 'yaml';
import { makeRelativePath } from '../../utils/path';
import { OBJECT_ICONS } from '../../screen';

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
        apiName: KUBEVIOUS_API_NAME,
        kind: KubeviousKinds.ClusterRule
    });

    for(const rule of rules)
    {
        const ruleConfig = rule.config.spec as ClusterRuleK8sSpec;
        
        logger.info("LIBRARY RULE: %s", rule.idKey);
        const category = makeRelativePath(Path.dirname(rule.source.source.path), dir);
        const rulePath = makeRelativePath(rule.source.source.path, dir);
        
        libraryObject.spec.rules.push({
            name: rule.id.name!,
            path: rulePath,
            category: category,
            summary: ruleConfig.summary ?? "",
        });
    }

    libraryObject.spec.rules = _.orderBy(libraryObject.spec.rules, [x => x.name, x => x.path]);

    const libraryResult : LibraryResult = {
        categories: []
    }

    {
        const categoryDict : Record<string, LibraryResultCategory> = {};
        for(const rule of libraryObject.spec.rules)
        {
            if (!categoryDict[rule.category]) {
                categoryDict[rule.category] = {
                    name: rule.category,
                    rules: []
                };
            }
            categoryDict[rule.category].rules.push(rule);
        }
        for(const category of _.values(categoryDict)) {
            category.rules = _.orderBy(category.rules, x => x.name);
        }

        libraryResult.categories = 
            _.chain(categoryDict)
             .values()
             .orderBy(x => x.name)
             .value();
    }


    if (guardResult.success)
    {
        await fs.writeFile(libraryFilePath,
            YAML.stringify(libraryObject, {
                toStringDefaults: {
                    indent: 2,
                    indentSeq: false
                }
            }));

        await setupDocs(dir, libraryResult);
    }

    const success = guardResult.success;

    return {
        success,
        manifestPackage,
        guardCommandData: guardResult,

        libraryDir: dir,
        libraryPath: libraryFilePath,
        library: libraryResult,
        rules,
    }
}

export function massageIndexOptions(options: Partial<IndexLibraryCommandOptions>) : IndexLibraryCommandOptions
{
    return {
    }
}

const README_BEGIN = '[//]: # (BEGIN_RULES_DESCRIPTION)';
const README_END = '[//]: # (END_RULES_DESCRIPTION)';
async function setupDocs(dir: string, libraryResult : LibraryResult)
{
    const readmePath = Path.join(dir, 'README.md');
    if (!existsSync(readmePath)) {
        return;
    }

    let contents = (await fs.readFile(readmePath)).toString();

    const beginIndex = contents.indexOf(README_BEGIN);
    logger.info("[beginIndex] %s", beginIndex);

    if (beginIndex == -1) {
        return;
    }
    const endIndex = contents.indexOf(README_END);
    logger.info("[endIndex] %s", endIndex);

    if (endIndex == -1) {
        return;
    }

    const deleteStartIndex = beginIndex + README_BEGIN.length;

    if (endIndex <= deleteStartIndex) {
        return;
    }

    contents = 
        contents.substring(0, deleteStartIndex) +
        "\n" + 
        generateMDDocs(libraryResult) +
        "\n" + 
        contents.substring(endIndex);

    await fs.writeFile(readmePath, contents);
}

function generateMDDocs(libraryResult : LibraryResult)
{
    let contents = '';

    contents += '\n'
    contents += '[//]: # (!!! DO NOT EDIT. AUTO-GENERATED WITH:)\n'
    contents += '[//]: # ($ kubevious index-library .)\n'
    contents += '[//]: # (OR PRE-COMMIT HOOK)\n'
    contents += '[//]: # ($ kubevious install-git-hook rule-library .)\n'
    contents += '\n'

    for(const category of libraryResult.categories)
    {
        contents += `### ${OBJECT_ICONS.ruleCategory.get()} ${_.toUpper(category.name)}`;
        contents += '\n';

        for(const rule of category.rules)
        {
            contents += `${OBJECT_ICONS.rule.get()} **[${rule.name}](${rule.path})**.`;
            contents += '\n';

            if (rule.summary.length > 0)
            {
                contents += rule.summary;
                contents += '\n';
            }

            contents += '\n';
        }
    }

    return contents;
}
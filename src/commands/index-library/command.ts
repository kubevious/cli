import _ from 'the-lodash';
import { logger } from '../../logger';
import Path from 'path';
import { promises as fs, existsSync } from 'fs';

import { IndexLibraryCommandData, IndexLibraryCommandOptions, Library, LibraryCategory, LibraryRule } from './types';

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

    
    const rules = guardResult.localK8sRegistry.query({
        apiName: KUBEVIOUS_API_NAME,
        kind: KubeviousKinds.ClusterRule
    });

    const libraryCategoriesDict : Record<string, LibraryCategory> = {};

    for(const rule of rules)
    {
        const ruleConfig = rule.config.spec as ClusterRuleK8sSpec;
        
        logger.info("LIBRARY RULE: %s", rule.idKey);

        const name = rule.id.name!;
        const summary = _.trim(ruleConfig.summary ?? "");

        const libraryRule : LibraryRule = {
            title: (summary.length > 0) ? summary : name,
            name: name,
            path: makeRelativePath(rule.source.id.path, dir),
            category: makeRelativePath(Path.dirname(rule.source.id.path), dir),
            summary: summary,
            description: _.trim(ruleConfig.description ?? ""),
        
            ruleSpec: ruleConfig,
        }

        if (!libraryCategoriesDict[libraryRule.category]) {
            libraryCategoriesDict[libraryRule.category] = {
                name: libraryRule.category,
                count: 0,
                rules: []
            }
        }

        libraryCategoriesDict[libraryRule.category].rules.push(libraryRule);
    }
    
    const library: Library = {
        count: _.sum(_.values(libraryCategoriesDict).map(x => x.rules.length)),
        categoryCount: _.keys(libraryCategoriesDict).length,
        categories: 
            _.chain(libraryCategoriesDict)
                .values()
                .orderBy(x => x.name)
                .value()
    }
    for(const category of library.categories)
    {
        category.count = category.rules.length;
        category.rules = _.orderBy(category.rules, x => x.name);
    }

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
    for(const category of library.categories)
    {
        for(const rule of category.rules)
        {
            libraryObject.spec.rules.push({
                name: rule.name,
                path: rule.path,
                category: rule.category,
                summary: rule.summary,
            });
        }
    }
    libraryObject.spec.rules = _.orderBy(libraryObject.spec.rules, [x => x.name, x => x.path]);

    const libraryFilePath = Path.join(dir, 'index.yaml');

    const success = guardResult.lintResult.severity == 'pass' || guardResult.lintResult.severity == 'warning';

    if (success)
    {
        await fs.writeFile(libraryFilePath,
            YAML.stringify(libraryObject, {
                toStringDefaults: {
                    indent: 2,
                    indentSeq: false
                }
            }));

        await setupDocs(dir, library);
    }
    
    return {
        success,
        manifestPackage,
        guardCommandData: guardResult,

        libraryDir: dir,
        libraryPath: libraryFilePath,
        library: library,
    }
}

export function massageIndexOptions(options: Partial<IndexLibraryCommandOptions>) : IndexLibraryCommandOptions
{
    return {
    }
}

const README_BEGIN = '[//]: # "BEGIN_RULES_DESCRIPTION"';
const README_END = '[//]: # "END_RULES_DESCRIPTION"';
async function setupDocs(dir: string, library : Library)
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
        generateMDDocs(library) +
        "\n" + 
        contents.substring(endIndex);

    await fs.writeFile(readmePath, contents);
}

function generateMDDocs(library : Library)
{
    let contents = '';

    contents += '\n'
    contents += '[//]: # "!!! DO NOT EDIT. AUTO-GENERATED WITH:"\n'
    contents += '[//]: # "$ kubevious index-library ."\n'
    contents += '[//]: # "OR PRE-COMMIT HOOK"\n'
    contents += '[//]: # "$ kubevious install-git-hook rule-library ."\n'
    contents += '\n'

    contents += `Total Rules: ${library.count}`;
    contents += '\n';

    contents += `### Categories:`;
    contents += '\n';

    for(const category of library.categories)
    {

        contents += `- [${OBJECT_ICONS.ruleCategory.get()} ${_.toUpper(category.name)} (${category.count})](#-${makeMdLink(category.name)})`;
        contents += '\n';
    }

    contents += `### Rules:`;
    contents += '\n';

    for(const category of library.categories)
    {
        contents += `#### ${OBJECT_ICONS.ruleCategory.get()} ${_.toUpper(category.name)}`;
        contents += '\n';

        for(const rule of category.rules)
        {
            contents += `${OBJECT_ICONS.rule.get()} **[${rule.title}](${rule.path})**`;
            contents += '\n';

            if (rule.description.length > 0)
            {
                contents += rule.description;
                contents += '\n';
            }

            contents += '\n';
        }
    }

    return contents;
}

function makeMdLink(str: string)
{
    str = _.toLower(str);
    str = str.replace(/\s/g, '-');
    str = str.replace(/\//g, '');
    return str;
}
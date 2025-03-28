import _ from 'the-lodash';
import { logger } from '../../logger';
import Path from 'path';
import { promises as fs, existsSync } from 'fs';

import { IndexLibraryCommandData, IndexLibraryCommandOptions, Library, LibraryLocation, LibraryRule } from './types';

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
        k8sSkipTlsVerify: false,

        includeRemoteTargets: false,
        skipLocalRules: false,
        skipRemoteRules: true,
    
        areNamespacesSpecified: false,
        namespaces: [],
        skipClusterScope: false,
        skipCommunityRules: true,
        skipRuleLibraries: true,
        allowDuplicates: false,

        ignorePatterns: [],

        skipRules: [],
        onlyRules: [],
        skipRuleCategories: [],
        onlyRuleCategories: [],
    });

    const manifestPackage = guardResult.manifestPackage;

    
    const rules = guardResult.localK8sRegistry.query({
        apiName: KUBEVIOUS_API_NAME,
        kind: KubeviousKinds.ClusterRule
    });

    const libraryLocationDict : Record<string, LibraryLocation> = {};

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
            location: makeRelativePath(Path.dirname(rule.source.id.path), dir),
            category: makeRelativePath(Path.dirname(rule.source.id.path), dir), // TODO: Retire
            summary: summary,
            description: _.trim(ruleConfig.description ?? ""),
            categories: ruleConfig.categories ?? [],
        
            ruleSpec: ruleConfig,
        }

        if (!libraryLocationDict[libraryRule.location]) {
            libraryLocationDict[libraryRule.location] = {
                name: libraryRule.location,
                count: 0,
                rules: []
            }
        }

        libraryLocationDict[libraryRule.location].rules.push(libraryRule);
    }
    
    const library: Library = {
        count: _.sum(_.values(libraryLocationDict).map(x => x.rules.length)),
        locationCount: _.keys(libraryLocationDict).length,
        locations: 
            _.chain(libraryLocationDict)
                .values()
                .orderBy(x => x.name)
                .value(),
    }
    for(const location of library.locations)
    {
        location.count = location.rules.length;
        location.rules = _.orderBy(location.rules, x => x.name);
    }

    const libraryObject : LibraryK8sObject = {
        apiVersion: `${KUBEVIOUS_API_NAME}/${KUBEVIOUS_API_VERSION}`,
        kind: KubeviousKinds.Library,
        metadata: {
            name: options.name
        },
        spec: {
            rules: []
        }
    }
    for(const location of library.locations)
    {
        for(const rule of location.rules)
        {
            libraryObject.spec.rules.push({
                name: rule.name,
                path: rule.path,
                location: rule.location,
                summary: rule.summary,
                categories: rule.categories
            });
        }
    }
    libraryObject.spec.rules = _.orderBy(libraryObject.spec.rules, [x => x.name, x => x.path]);

    const libraryFilePath = Path.join(dir, 'index.yaml');

    const success = guardResult.severity == 'pass' || guardResult.severity == 'warning';

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
        name: options.name ?? 'library'
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

    contents += `### Locations:`;
    contents += '\n';

    for(const location of library.locations)
    {
        contents += `- [${OBJECT_ICONS.ruleLocation.get()} ${_.toUpper(location.name)} (${location.count})](#-${makeMdLink(location.name)})`;
        contents += '\n';
    }

    contents += `### Rules:`;
    contents += '\n';

    for(const location of library.locations)
    {
        contents += `#### ${OBJECT_ICONS.ruleLocation.get()} ${_.toUpper(location.name)}`;
        contents += '\n';

        for(const rule of location.rules)
        {
            contents += `${OBJECT_ICONS.rule.get()} **[${rule.title}](${rule.path})**`;
            contents += '\n';

            if (rule.categories.length > 0)
            {
                contents += '- ' + rule.categories.map(x => `${OBJECT_ICONS.ruleCategory.get()} ${x}`).join(' ');
                contents += '\n';
            }

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
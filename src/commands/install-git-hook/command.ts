import _ from 'the-lodash';
import { logger as rootLogger } from '../../logger';
import Path from 'path';
import { promises as fs, existsSync } from 'fs';
import YAML from 'yaml';
import { InstallHookCommandData, InstallHookOptions, PreCommitConfigSpec } from './types';
import { getLatestReleaseTag } from '../../utils/release';

const logger = rootLogger.sublogger('InstallGitHookCmd');

const HOOK_REPO = 'https://github.com/kubevious/cli';

export async function command(origPath: string | undefined, options: InstallHookOptions) : Promise<InstallHookCommandData>
{
    const repoPath = Path.resolve(origPath ?? '.');

    const result : InstallHookCommandData = {
        success: true,
        steps: [],
        repoPath: repoPath,
        preCommitConfigPath: Path.join(repoPath, '.pre-commit-config.yaml'),
        hook: {
            repo: HOOK_REPO,
            id: options.hook,
        },
        errors: [],
    }

    logger.info("repoPath: %s", result.repoPath);
    logger.info("preCommitConfigPath: %s", result.preCommitConfigPath);

    if (!(await checkGitRepoPath(result)))
    {
        result.success = false;
        result.steps.push({ name: `Repository: ${result.repoPath}`, success: false });
        return result;
    }

    result.steps.push({ name: `Repository: ${result.repoPath}`, success: true });
    result.steps.push({ name: `PreCommit Config File: ${result.preCommitConfigPath}`, success: true });

    result.steps.push({ name: `Hook Repo: ${result.hook.repo}`, success: true });
    result.steps.push({ name: `Hook ID: ${result.hook.id}`, success: true });


    let configSpec: PreCommitConfigSpec = { repos: [] };
    if (existsSync(result.preCommitConfigPath))
    {
        logger.info("Loading from: %s...", result.preCommitConfigPath);

        const contents = (await fs.readFile(result.preCommitConfigPath)).toString();
        configSpec = YAML.parseDocument(contents).toJSON();
    }

    logger.info("PreCommitHookConfig: ", configSpec);

    let hookRepoSpec =  _.find(configSpec.repos, x => x.repo === HOOK_REPO);
    if (!hookRepoSpec) {
        hookRepoSpec = {
            repo: HOOK_REPO
        };
        configSpec.repos.push(hookRepoSpec);
    }
    hookRepoSpec.rev = 'HEAD';
    hookRepoSpec.hooks = hookRepoSpec.hooks ?? [];

    if (!_.find(hookRepoSpec.hooks, x => x.id === options.hook))
    {
        hookRepoSpec.hooks.push({
            id: options.hook
        });
    }

    
    try
    {
        const tag = await getLatestReleaseTag();
        hookRepoSpec.rev = tag;
    }
    catch(reason: any)
    {
        logger.info("Failed to fetch release tag. ", reason);

        result.success = false;
        result.errors!.push('Failed to fetch latest release tag.');

        if (reason.message) {
            result.errors!.push(reason.message);
        }

        return result;
    }

    {
        const contents = YAML.stringify(configSpec, {
            toStringDefaults: {
                indent: 2,
                indentSeq: true
            }
        });
        await fs.writeFile(result.preCommitConfigPath, contents);
    }

    return result;
}

async function checkGitRepoPath(result : InstallHookCommandData)
{
    if (!existsSync(result.repoPath)) {
        result.errors.push("Directory not found.");
        return false;
    }

    try
    {
        const stats = await fs.lstat(result.repoPath);
        if (!stats.isDirectory()) {
            result.errors.push("Doesn't look like a directory.");
            return false;
        }
    }
    catch
    {
        result.success = false;
        result.errors.push("Doesn't look like a directory.");
        return false;
    }


    try
    {
        const stats = await fs.lstat(Path.join(result.repoPath, '.git'));
        if (!stats.isDirectory()) {
            result.errors.push("Doesn't look like a GIT repo.");
            return false;
        }
    }
    catch
    {
        result.errors.push("Doesn't look like a GIT repo.");
        return false;
    }

    return true;

}
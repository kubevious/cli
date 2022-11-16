import _ from 'the-lodash';
import { Command } from 'commander';

import setupRulesLibrary from './rule-library';
import setupLint from './lint';
import setupGuard from './guard';

export default function (program: Command)
{
    const command = 
        program
            .command('install-git-hook')
            .summary("Set up GIT pre-commit hooks to validate Kubernetes manifests before committing.")
            .description(`
Uses pre-commit project to set up GIT pre-commit hooks. 
Learn more: https://pre-commit.com/

Hooks execute in containers, so Docker Desktop should be running.
Available hooks: https://github.com/kubevious/cli/blob/main/.pre-commit-hooks.yaml
`);

    setupGuard(command);
    setupLint(command);
    setupRulesLibrary(command);
}

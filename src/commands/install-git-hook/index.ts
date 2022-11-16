import _ from 'the-lodash';
import { Command } from 'commander';

import setupRulesLibrary from './rule-library';
import setupLint from './lint';

export default function (program: Command)
{
    const command = 
        program
            .command('install-git-hook');

    setupLint(command);

    setupRulesLibrary(command);
}

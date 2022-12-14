import { program } from 'commander';
import VERSION from '../../version'

import setupLintManifests from '../lint';
import setupGuard from '../guard';
import setupListKnownK8sVersions from '../list-known-k8s-versions';
import setupIndexLibrary from '../index-library';
import setupInstallGitHook from '../install-git-hook';
import setupSupport from '../support';
import { DESCRIPTION, SUMMARY } from './docs';

export function setupProgram()
{
    program
        .name('kubevious')
        .summary(SUMMARY)
        .description(DESCRIPTION)
        .version(VERSION);
  
    setupGuard(program);
    setupLintManifests(program);
    setupListKnownK8sVersions(program);
    setupIndexLibrary(program);
    setupInstallGitHook(program);
    setupSupport(program);

    program.parse();
}
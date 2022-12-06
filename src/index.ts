// console.log("[execPath]: ", process.execPath)
// console.log("[execArgv]: ", process.execArgv)
// console.log("[argv]: ", process.argv)

import _ from 'the-lodash';
import { logger } from './logger';
import VERSION from './version'

import { program } from 'commander';
import setupLintManifests from './commands/lint';
import setupGuard from './commands/guard';
import setupListKnownK8sVersions from './commands/list-known-k8s-versions';
import setupIndexLibrary from './commands/index-library';
import setupInstallGitHook from './commands/install-git-hook';
import setupSupport from './commands/support';

logger.info("[execPath]: %s", process.execPath)
logger.info("[execArgv]: ", process.execArgv)
logger.info("[argv]: ", process.argv)


program
  .name('kubevious')
  .description('Kubevious CLI validates Kubernetes manifests.\nFind more information at: https://github.com/kubevious/cli')
  .version(VERSION);

setupGuard(program);
setupLintManifests(program);
setupListKnownK8sVersions(program);
setupIndexLibrary(program);
setupInstallGitHook(program);
setupSupport(program);

program.parse();
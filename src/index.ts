import _ from 'the-lodash';
import { logger } from './logger';
import VERSION from './version'

import { program } from 'commander';
import setupLintManifests from './commands/lint-manifests';
import setupListKnownK8sVersions from './commands/list-known-k8s-versions';

logger.info("[execPath]: %s", process.execPath)
logger.info("[execArgv]: ", process.execArgv)
logger.info("[argv]: ", process.argv)

program
  .name('kubevious')
  .description('Kubevious CLI validates Kubernetes manifests.\nFind more information at: https://github.com/kubevious/cli')
  .version(VERSION);

setupLintManifests(program);
setupListKnownK8sVersions(program);

program.parse();
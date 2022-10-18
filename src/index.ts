import _ from 'the-lodash';
import { logger } from './logger';
import VERSION from './version'

import { program } from 'commander';
import setupExtractManifests from './commands/extract-manifests';
import setupLintManifests from './commands/lint-manifests';
import setupListKnownK8sVersions from './commands/list-known-k8s-versions';

program
  .name('kubevious')
  .description('Kubevious CLI validates Kubernetes manifests.\nFind more information at: https://github.com/kubevious/cli')
  .version(VERSION);

setupExtractManifests(program);
setupLintManifests(program);
setupListKnownK8sVersions(program);

program.parse();
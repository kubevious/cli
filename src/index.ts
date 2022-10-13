import _ from 'the-lodash';
import { logger } from './logger';
import VERSION from './version'

import { program } from 'commander';
import setupSplitTest from './commands/split-test';
import setupScanManifests from './commands/scan-manifests';
import setupLintManifests from './commands/lint-manifests';

program
  .name('kubevious')
  .description('Kubevious CLI validates Kubernetes manifests.\nFind more information at: https://github.com/kubevious/cli')
  .version(VERSION);

setupSplitTest(program);
setupScanManifests(program);
setupLintManifests(program);

program.parse();
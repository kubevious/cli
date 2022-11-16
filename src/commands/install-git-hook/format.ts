import _ from 'the-lodash';

import { logger as rootLogger } from '../../logger';
import { InstallHookCommandData } from './types';


const logger = rootLogger.sublogger('InstallGitHookFormat');

export function formatResult(commandData : InstallHookCommandData) : InstallHookCommandData
{
    return commandData;
}

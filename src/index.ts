import _ from 'the-lodash';
import { logger } from './logger';

import { setupProgram } from './commands/program';

logger.info("[execPath]: %s", process.execPath)
logger.info("[execArgv]: ", process.execArgv)
logger.info("[argv]: ", process.argv)

setupProgram();
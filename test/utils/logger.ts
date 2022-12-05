
import _ from 'the-lodash';
import { LoggerOptions, LogLevel, setupRootLogger } from 'the-logger';

const loggerOptions = new LoggerOptions()
    .level(LogLevel.info)
    .enableFile(false)
    .pretty(true)
    ;

const rootLogger = setupRootLogger('TEST', loggerOptions);
export const logger = rootLogger.logger;

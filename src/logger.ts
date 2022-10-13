
import _ from 'the-lodash';
import { LoggerOptions, LogLevel, setupRootLogger } from 'the-logger';

const loggerOptions = new LoggerOptions();

loggerOptions.pretty(true);

let logLevel = LogLevel.warn;
if (process.env.LOG_LEVEL) {
    logLevel = <LogLevel>process.env.LOG_LEVEL;
}
loggerOptions.level(logLevel);

if (process.env.LOG_TO_FILE &&
    (process.env.LOG_TO_FILE == 'true' || process.env.LOG_TO_FILE == 'yes'))
{
    loggerOptions.enableFile(true);
    loggerOptions.cleanOnStart(true);
}


const LogLevelOverridePrefix = 'LOG_LEVEL_'
for(const key of _.keys(process.env).filter(x => _.startsWith(x, LogLevelOverridePrefix)))
{
    const sublevelName = key.substring(LogLevelOverridePrefix.length);
    const logLevel = <LogLevel>process.env[key];
    loggerOptions.subLevel(sublevelName, logLevel);
}


const rootLogger = setupRootLogger('CLI', loggerOptions);
export const logger = rootLogger.logger;

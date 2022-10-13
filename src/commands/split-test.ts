import { Command } from 'commander';
import { logger } from '../logger';

export default function (program: Command)
{
    program
        .command('split')
        .description('Split a string into substrings and display as an array')
        .argument('<string>', 'string to split')
        .option('--first', 'display just the first substring')
        .option('-s, --separator <char>', 'separator character', ',')
        .action((str, options) => {

            logger.info("OPTIONS: ", options);
            logger.info("str: ", str);
        });
}

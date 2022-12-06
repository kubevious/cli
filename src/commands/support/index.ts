import _ from 'the-lodash';
import { Command } from 'commander';
import VERSION from '../../version';

import { printSectionTitle, OTHER_ICONS, print } from "../../screen";

export default function (program: Command)
{
    program
        .command('support')
        .description('Get help and support.')
        .action(
            (...args: any[]) => {

                printSectionTitle(`Kubevious CLI ${VERSION}`);

                print();

                print(`${OTHER_ICONS.email.get()} support@kubevious.io`, 4);
                print(`${OTHER_ICONS.bug.get()} https://github.com/kubevious/cli/issues`, 4);
                print(`${OTHER_ICONS.slack.get()} https://kubevious.io/slack`, 4);

                print();

                print(`${OTHER_ICONS.party.get()} Lets us know if you encounter issues, have a feature request, or need help writing custom rules!`);

                print();

            }
        );
}

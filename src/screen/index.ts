import _ from 'the-lodash';
import chalk from 'chalk';
import emoji from 'node-emoji';


export function indentify(str: string, count?: number) : string
{
    const prefix = ' '.repeat(count ?? 0);
    let lines = str.split('\n');
    lines = lines.map(x => `${prefix}${x}`);
    return lines.join('\n');
}

export function print(str?: string, indent?: number)
{
    console.log(indentify(str ?? "", indent));
}

export function printInfoLine(str: string, indent?: number)
{
    print(`${STATUS_ICONS.info.get()} ${str}`, indent);
}
export function printPassLine(str: string, indent?: number)
{
    print(`${STATUS_ICONS.passed.get()} ${str}`, indent);
}
export function printFailLine(str: string, indent?: number)
{
    print(`${STATUS_ICONS.failed.get()} ${str}`, indent);
}
export function printErrorLine(str: string, indent?: number)
{
    print(`${STATUS_ICONS.error.get()} ${str}`, indent);
}
export function printErrors(lines?: string[], indent?: number)
{
    if (lines) {
        for(const x of lines)
        {
            printErrorLine(x, indent);
        }
    }
}
export function printWarningLine(str?: string, indent?: number)
{
    print(`${STATUS_ICONS.warning.get()} ${str}`, indent);
}
export function printWarnings(lines?: string[], indent?: number)
{
    if (lines) {
        for(const x of lines)
        {
            printWarningLine(x, indent);
        }
    }
}

export function printSectionTitle(title: string, indent? : number)
{
    print(chalk.underline(title), indent);
}

export function printProcessStatus(success: boolean, taskName: string)
{
    print();
    if (success)
    {
        print(`${emoji.get('white_check_mark')} ${taskName} Succeeded.`);
    }
    else
    {
        print(`${emoji.get('x')} ${taskName} Failed`);
    }
}


export class IconDefinition
{
    private _active: string;
    private _inactive: string;

    constructor(active: string, inactive?: string)
    {
        this._active = active;
        this._inactive = inactive ?? active;
    }

    get(isActiveOrCount? : boolean | number)
    {
        let isActive = true;
        if (_.isNumber(isActiveOrCount)) {
            isActive = isActiveOrCount > 0;
        } else {
            isActive = isActiveOrCount ?? true
        }

        if (isActive) {
            return this._active;
        } else {
            return this._inactive;
        }
    }
}

export const STATUS_ICONS = {
    passed: new IconDefinition(emoji.get(':white_check_mark:'), `${emoji.get(':ballot_box_with_check:')} `),
    failed: new IconDefinition(emoji.get(':x:'), `${emoji.get(':heavy_multiplication_x:')} `),
    error: new IconDefinition(emoji.get(':red_circle:'), emoji.get(':radio_button:')),
    warning: new IconDefinition(`${emoji.get(':warning:')} `, emoji.get(':grey_exclamation:')),
    question: new IconDefinition(`${emoji.get(':question:')} `, emoji.get(':grey_question:')),
    info: new IconDefinition(`${emoji.get(':information_source:')}`),
}

export const OBJECT_ICONS = {
    manifest: new IconDefinition(emoji.get(':page_facing_up:')),
    rule: new IconDefinition(emoji.get(':scroll:')),
}

export const SOURCE_ICONS = {
    file: new IconDefinition(emoji.get(':page_facing_up:')),
    web: new IconDefinition(emoji.get(':web:')),
    stream: new IconDefinition(emoji.get(':aquarius:')),
    k8s: new IconDefinition('☸️ '),
}

export function printSummaryCounter(icon: IconDefinition, title: string, count: number)
{
    print(`${icon.get(count)} ${title}: ${count}`, 8);
}
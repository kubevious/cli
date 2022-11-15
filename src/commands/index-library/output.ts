import chalk from 'chalk';
import emoji from 'node-emoji';

import { IndexLibraryResult } from "./types";

import { output as guardOutput } from '../guard/output'

export function output(result: IndexLibraryResult)
{
    guardOutput(result.guardResult);

    // for(const rule of result.rules)
    // {

    // }
}

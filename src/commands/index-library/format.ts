import _ from 'the-lodash';

import { logger } from '../../logger';
import { IndexLibraryCommandData, IndexLibraryResult } from "./types";

import { formatResult as guardFormatResult } from '../guard/format'

export function formatResult({
    success,
    manifestPackage,
    guardCommandData,
    rules,
    libraryPath,
    libraryObject
    }: IndexLibraryCommandData) : IndexLibraryResult
{

    const guardResult = guardFormatResult(guardCommandData);

    const result: IndexLibraryResult = {
        success: success,

        guardResult: guardResult,

        libraryPath: libraryPath,
        libraryRules: libraryObject.spec.rules,
    }

    return result;
}

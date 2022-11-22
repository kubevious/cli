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
    library
    }: IndexLibraryCommandData) : IndexLibraryResult
{

    const guardResult = guardFormatResult(guardCommandData);

    const result: IndexLibraryResult = {
        success: success,

        guardResult: guardResult,

        libraryPath: libraryPath,
        library: library,
    }

    return result;
}

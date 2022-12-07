import 'mocha';
import should = require('should');

import _ from 'the-lodash';

import { isWebPath } from '../src/utils/path';

import { logger } from './utils/logger';
import Path from 'path';

describe('is-web-path', function() {

    it('case-01', function() {
        const result = isWebPath('samples/test.yaml');
        should(result).be.false();
    });


    it('case-02', function() {
        const result = isWebPath('/usr/local/samples/test.yamlzz');
        should(result).be.false();
    });


    it('case-03', function() {
        const result = isWebPath('/usr/local/samples/test.yaml');
        should(result).be.false();
    });

    it('case-03', function() {
        const result = isWebPath('samples/test.yaml');
        should(result).be.false();
    });


    it('case-04', function() {
        const result = isWebPath('http://samples/test.yaml');
        should(result).be.true();
    });

    it('case-05', function() {
        const result = isWebPath('https://samples/test.yaml');
        should(result).be.true();
    });


});

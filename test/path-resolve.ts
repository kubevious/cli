import 'mocha';
import should = require('should');

import _ from 'the-lodash';

import { resolvePath } from '../src/utils/path';

import { logger } from './utils/logger';
import Path from 'path';

describe('helper-path-resolve', function() {

    it('case-01', function() {
        const result = resolvePath('samples/test.yaml');
        should(result).be.equal(Path.resolve('./samples/test.yaml'));
    });


    it('case-02', function() {
        const result = resolvePath('samples/test.yaml', '/usr/local/sample.yaml');
        should(result).be.equal('/usr/local/samples/test.yaml');
    });


    it('case-03', function() {
        const result = resolvePath('http://samples/test.yaml');
        should(result).be.equal('http://samples/test.yaml');
    });

    it('case-04', function() {
        const result = resolvePath('http://samples/test.yaml', '/usr/local/sample.yaml');
        should(result).be.equal('http://samples/test.yaml');
    });

    it('case-05', function() {
        const result = resolvePath('https://samples/test.yaml', 'https://example.com/another/index.yaml');
        should(result).be.equal('https://samples/test.yaml');
    });


});
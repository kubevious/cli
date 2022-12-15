import 'mocha';
import should = require('should');

import _ from 'the-lodash';

import { parseUserInputPath } from '../src/input/utils';

describe('helper-user-path-parser', function() {

    it('file-path', function() {
        const result = parseUserInputPath('samples/service.yaml');
        should(result).be.ok();
        should(result.kind).be.equal('file');
        should(result.path).be.equal('samples/service.yaml');
        should(result.suffixes).be.eql([]);
        should(result.isInvalid).be.not.ok();
    });

    it('http-path', function() {
        const result = parseUserInputPath('http://samples.com/service.yaml');
        should(result).be.ok();
        should(result.kind).be.equal('web');
        should(result.path).be.equal('http://samples.com/service.yaml');
        should(result.suffixes).be.eql([]);
        should(result.isInvalid).be.not.ok();
    });

    it('https-path', function() {
        const result = parseUserInputPath('https://samples.com/service.yaml');
        // console.log(result);
        should(result).be.ok();
        should(result.kind).be.equal('web');
        should(result.path).be.equal('https://samples.com/service.yaml');
        should(result.suffixes).be.eql([]);
        should(result.isInvalid).be.not.ok();
    });

    it('helm-path-with-overrides', function() {
        const result = parseUserInputPath('helm.git/charts@values=samples/overrides.yaml');
        should(result).be.ok();
        should(result.kind).be.equal('file');
        should(result.path).be.equal('helm.git/charts');
        should(result.suffixes).be.eql([{ key: 'values', value: 'samples/overrides.yaml' }]);
        should(result.isInvalid).be.not.ok();
    });

    it('helm-kind-no-overrides', function() {
        const result = parseUserInputPath('@helm@traefik/traefik');
        should(result).be.ok();
        should(result.kind).be.equal('helm');
        should(result.path).be.equal('traefik/traefik');
        should(result.suffixes).be.eql([]);
        should(result.isInvalid).be.not.ok();
    });

    it('helm-kind-with-overrides', function() {
        const result = parseUserInputPath('@helm@charts.git/charts@values=samples/overrides.yaml');
        should(result).be.ok();
        should(result.kind).be.equal('helm');
        should(result.path).be.equal('charts.git/charts');
        should(result.suffixes).be.eql([{ key: 'values', value: 'samples/overrides.yaml' }]);
        should(result.isInvalid).be.not.ok();
    });

    it('bad-kind', function() {
        const result = parseUserInputPath('@kustomize@the-path/');
        // console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.true();
    });

    it('no-helm-chart-name', function() {
        const result = parseUserInputPath('@helm');
        // console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.true();
    });

    it('empty', function() {
        const result = parseUserInputPath('');
        // console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.true();
    });

    it('empty-2', function() {
        const result = parseUserInputPath('@');
        // console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.true();
    });
});
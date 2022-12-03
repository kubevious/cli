import 'mocha';
import should = require('should');

import _ from 'the-lodash';

import { parseImage } from '../src/rules-engine/helpers/image';

describe('parseImage', function() {

    it('case-01', function() {
        const result = parseImage('nginx');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('docker.io');
        should(result.repository).be.equal('nginx');
        should(result.namespace).be.equal('');
        should(result.name).be.equal('nginx');
        should(result.tag).be.equal('latest');
    });

    it('case-02', function() {
        const result = parseImage('quay.io/nginx');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('docker.io');
        should(result.repository).be.equal('quay.io/nginx');
        should(result.namespace).be.equal('quay.io');
        should(result.name).be.equal('nginx');
        should(result.tag).be.equal('latest');
    });

    it('case-03', function() {
        const result = parseImage('nginx:v1');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('docker.io');
        should(result.repository).be.equal('nginx');
        should(result.namespace).be.equal('');
        should(result.name).be.equal('nginx');
        should(result.tag).be.equal('v1');
    });

    it('case-04', function() {
        const result = parseImage('gcr.io/nginx:v1');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('docker.io');
        should(result.repository).be.equal('gcr.io/nginx');
        should(result.namespace).be.equal('gcr.io');
        should(result.name).be.equal('nginx');
        should(result.tag).be.equal('v1');
    });



    it('case-05', function() {
        const result = parseImage('kubevious/cli');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('docker.io');
        should(result.repository).be.equal('kubevious/cli');
        should(result.namespace).be.equal('kubevious');
        should(result.name).be.equal('cli');
        should(result.tag).be.equal('latest');
    });

    it('case-06', function() {
        const result = parseImage('kubevious/cli:v2');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('docker.io');
        should(result.repository).be.equal('kubevious/cli');
        should(result.namespace).be.equal('kubevious');
        should(result.name).be.equal('cli');
        should(result.tag).be.equal('v2');
    });

    it('case-07', function() {
        const result = parseImage('quay.io/kubevious/cli');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('quay.io');
        should(result.repository).be.equal('kubevious/cli');
        should(result.namespace).be.equal('kubevious');
        should(result.name).be.equal('cli');
        should(result.tag).be.equal('latest');
    });

    it('case-08', function() {
        const result = parseImage('quay.io/kubevious/cli:v3');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('quay.io');
        should(result.repository).be.equal('kubevious/cli');
        should(result.namespace).be.equal('kubevious');
        should(result.name).be.equal('cli');
        should(result.tag).be.equal('v3');
    });


    it('case-09', function() {
        const result = parseImage('gcr.io/google-samples/microservices-demo/emailservice:v0.3.6');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('gcr.io');
        should(result.repository).be.equal('google-samples/microservices-demo/emailservice');
        should(result.namespace).be.equal('google-samples/microservices-demo');
        should(result.name).be.equal('emailservice');
        should(result.tag).be.equal('v0.3.6');
    });

    
    it('case-10', function() {
        const result = parseImage('gcr.io/google-samples/microservices-demo/emailservice');
        console.log(result);
        should(result).be.ok();
        should(result.isInvalid).be.not.ok();
        should(result.registry).be.equal('gcr.io');
        should(result.repository).be.equal('google-samples/microservices-demo/emailservice');
        should(result.namespace).be.equal('google-samples/microservices-demo');
        should(result.name).be.equal('emailservice');
        should(result.tag).be.equal('latest');
    });



});
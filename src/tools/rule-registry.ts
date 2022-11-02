import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { RuleObject } from '../types/rules';

export class RuleRegistry
{
    private _logger: ILogger;
    private _rules : RuleObject[] = [];

    constructor(logger: ILogger)
    {
        this._logger = logger.sublogger('RuleRegistry');
    }

    get rules() {
        return this._rules;
    }

    init()
    {
        this.loadRule({
            name: 'certificate-check',
            target: `
ApiVersion('cert-manager.io/v1')
.Kind('Certificate')`,
            script: `
const issuer = ApiVersion('cert-manager.io/v1')
            .Kind(config.spec?.issuerRef?.kind)
            .name(config.spec?.issuerRef?.name)
            .single();
if (!issuer) {
error('Could not find the Certificate Issuer');
} else {
const email = issuer.config.spec?.acme?.email ?? "";
if (!email.endsWith('example.com')) {
error(\`Using not approved email: \${email}\`);
}
}`
        })
    }

    loadRule(rule : RuleObject)
    {
        this._rules.push(rule);
    }

}

import _ from 'the-lodash';
import { ILogger } from 'the-logger';
import { RuleObject } from '../../types/rules';

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

        this.loadRule({
            name: 'service-selector-check',
            target: `
ApiVersion('v1')
.Kind('Service')`,
            script: `
const apps = ApiVersion('apps/v1')
            .Kind("Deployment")
            .many();

const myApps = [];
for(const app of apps)
{
    if (matchesDict(config.spec.selector ?? {}, app.config.spec.template.metadata.labels ?? {}))
    {
        myApps.push(app);
    }
}
if (myApps.length === 0) {
    error("Could not find APPS for Service");
}

function matchesDict(selector, labels)
{
    for(const key of Object.keys(selector))
    {
        if (selector[key] !== labels[key])
        {
            return false;
        }
    }
    return true;
}
`
        });



        this.loadRule({
            name: 'bad-rule',
            target: `
ApiVersion('cert-manager.io/v1')
.Kind('Certificate')
xxx`,
            script: `
ddd
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

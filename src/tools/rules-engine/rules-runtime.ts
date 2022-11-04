import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../../types/rules';
import { RuleRegistry } from './rule-registry';
import { RuleRuntime } from './rule-runtime';
import { RegistryQueryExecutor } from './query-executor';
import { ExecutionContext } from './execution-context';
import { ManifestPackage } from '../manifest-package';
import { RuleEngineReporter } from './rule-engine-reporter';
import { ISpinner, spinOperation } from '../../utils/screen';

export class RulesRuntime
{
    private _logger: ILogger;
    private _ruleRegistry: RuleRegistry;

    private _rules : RuleRuntime[] = [];

    private _executionContext : ExecutionContext;
    private _ruleEngineReporter : RuleEngineReporter;
    private _spinner? : ISpinner;

    constructor(logger: ILogger,
                ruleRegistry: RuleRegistry,
                registryQueryExecutor: RegistryQueryExecutor,
                manifestPackage: ManifestPackage)
    {
        this._logger = logger.sublogger('RulesRuntime');
        this._ruleRegistry = ruleRegistry;
        this._executionContext = new ExecutionContext(this._logger, registryQueryExecutor, manifestPackage);
        this._ruleEngineReporter = new RuleEngineReporter(this._logger, manifestPackage);
    }

    get rules() {
        return this._rules;
    }

    init()
    {
        return Promise.serial(this._ruleRegistry.rules, x => this._initRule(x));
    }

    execute()
    {
        this._spinner = spinOperation('Validating rules...');

        return Promise.serial(this._rules, x => this._executeRule(x))
            .then(() => {
                this._spinner!.complete('Rules validation complete.')
            })
    }

    private _initRule(rule : RuleObject)
    {
        const ruleRuntime = new RuleRuntime(this._logger, rule, this._executionContext, this._ruleEngineReporter);
        return ruleRuntime.init()
            .then(() => {
                this._rules.push(ruleRuntime);
            })
    }

    private _executeRule(rule : RuleRuntime)
    {
        return Promise.resolve()
            .then(() => rule.execute());
    }
}



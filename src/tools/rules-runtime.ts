import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../types/rules';
import { RuleRegistry } from './rule-registry';
import { RuleRuntime } from './rule-runtime';

export class RulesRuntime
{
    private _logger: ILogger;
    private _ruleRegistry: RuleRegistry;

    private _rules : RuleRuntime[] = [];

    constructor(logger: ILogger, ruleRegistry: RuleRegistry)
    {
        this._logger = logger.sublogger('RulesRuntime');
        this._ruleRegistry = ruleRegistry;
    }

    init()
    {
        return Promise.serial(this._ruleRegistry.rules, x => this._initRule(x));
    }

    private _initRule(rule : RuleObject)
    {
        const ruleRuntime = new RuleRuntime(this._logger, rule);
        return ruleRuntime.init()
            .then(() => {
                this._rules.push(ruleRuntime);
            })

        
    }
}



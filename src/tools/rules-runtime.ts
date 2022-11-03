import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { ILogger } from 'the-logger';
import { RuleObject } from '../types/rules';
import { RuleRegistry } from './rule-registry';
import { RuleRuntime } from './rule-runtime';
import { RegistryAccessor } from '@kubevious/state-registry';
import { ExecutionState } from '@kubevious/kubik/dist/processors/execution-state';
import { RegistryQueryExecutor } from './rules-engine/query-executor';
import { ExecutionContext } from './rules-engine/execution-context';
import { ManifestPackage } from './manifest-package';

export class RulesRuntime
{
    private _logger: ILogger;
    private _ruleRegistry: RuleRegistry;

    private _rules : RuleRuntime[] = [];

    private _registryQueryExecutor : RegistryQueryExecutor;
    private _manifestPackage : ManifestPackage;
    private _executionContext : ExecutionContext;
    
    constructor(logger: ILogger, ruleRegistry: RuleRegistry, registryQueryExecutor : RegistryQueryExecutor, manifestPackage : ManifestPackage)
    {
        this._logger = logger.sublogger('RulesRuntime');
        this._ruleRegistry = ruleRegistry;
        this._registryQueryExecutor = registryQueryExecutor;
        this._manifestPackage = manifestPackage;
        this._executionContext = new ExecutionContext(this._logger, registryQueryExecutor, manifestPackage);
    }

    init()
    {
        return Promise.serial(this._ruleRegistry.rules, x => this._initRule(x));
    }

    execute()
    {
        return Promise.serial(this._rules, x => x.execute());
    }

    private _initRule(rule : RuleObject)
    {
        const ruleRuntime = new RuleRuntime(this._logger, rule, this._executionContext);
        return ruleRuntime.init()
            .then(() => {
                this._rules.push(ruleRuntime);
            })
    }
}



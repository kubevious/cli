import _ from 'the-lodash';
import { ResultObject } from "./result";

export class BaseObject
{
    private _selfSuccess = true;
    private _selfErrors: string[] = [];
    private _selfWarnings: string[] = [];

    public get success() {
        return this._selfSuccess;
    }

    public get selfErrors(): string[] {
        return this._selfErrors;
    }

    public get errors() {
        return this.selfErrors; //TODO:
    }

    public get selfWarnings(): string[] {
        return this._selfWarnings;
    }

    public get warnings() {
        return this.selfWarnings; //TODO:
    }

    public reportError(msg: string)
    {
        this._selfErrors.push(msg);
        this._selfSuccess = false;
    }

    public reportErrors(msgs?: string[])
    {
        for(const msg of msgs ?? [])
        {
            this.reportError(msg);
        }
    }

    public reportWarning(msg: string)
    {
        this._selfWarnings.push(msg);
    }

    public reportWarnings(msgs?: string[])
    {
        for(const msg of msgs ?? [])
        {
            this.reportWarning(msg);
        }
    }

    protected extractBaseResult() : ResultObject {
        const result : ResultObject = {
            severity: 'pass',
        }

        if (this.errors.length > 0)
        {
            result.severity = 'fail';
            if (!result.messages) {
                result.messages = [];
            }
            result.messages = _.concat(result.messages, this.errors.map(x => ({ severity: 'error', msg: x})));
        }

        if (this.warnings.length > 0)
        {
            if (result.severity === 'pass') {
                result.severity = 'fail';
            }
            if (!result.messages) {
                result.messages = [];
            }
            result.messages = _.concat(result.messages, this.warnings.map(x => ({ severity: 'warning', msg: x})));
        }

        return result;
    }

    protected yieldChildren() : BaseObject[]
    {
        return [];
    }
}
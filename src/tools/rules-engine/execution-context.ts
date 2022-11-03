import { RegistryQueryExecutor } from "./query-executor";

export class ExecutionContext
{
    private _registryQueryExecutor : RegistryQueryExecutor;
    
    constructor(registryQueryExecutor : RegistryQueryExecutor)
    {
        this._registryQueryExecutor = registryQueryExecutor;
    }

    get registryQueryExecutor() {
        return this._registryQueryExecutor;
    }
}
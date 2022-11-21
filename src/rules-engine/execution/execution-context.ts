import { ILogger } from "the-logger";
import { ManifestPackage } from "../../manifests/manifest-package";
import { RegistryQueryExecutor } from "../query-executor";
import { QueryExecutor } from "../query/query-executor";

export class ExecutionContext
{
    private _logger : ILogger;
    private _registryQueryExecutor : RegistryQueryExecutor;
    private _manifestPackage : ManifestPackage;
    private _queryExecutor : QueryExecutor;

    constructor(logger : ILogger, registryQueryExecutor : RegistryQueryExecutor, manifestPackage : ManifestPackage)
    {
        this._logger = logger.sublogger("ExecutionContext");
        this._registryQueryExecutor = registryQueryExecutor;
        this._manifestPackage = manifestPackage;
        this._queryExecutor = new QueryExecutor(this);
    }

    get logger () {
        return this._logger;
    }

    get registryQueryExecutor() {
        return this._registryQueryExecutor;
    }

    get manifestPackage() {
        return this._manifestPackage;
    }

    get queryExecutor() {
        return this._queryExecutor;
    }
}
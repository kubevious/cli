
import { K8sObject } from '../../types/k8s';

export class ScriptItem
{
    private _config: K8sObject;

    constructor(config: K8sObject) {
        this._config = config;
    }

    get apiVersion() {
        return this.config.apiVersion;
    }

    get kind() {
        return this.config.kind;
    }

    get name() {
        return this.config?.metadata?.name || "";
    }

    get namespace () {
        return this.config?.metadata?.namespace;
    }

    get config() {
        return this._config;
    }

    get labels() {
        return this.config?.metadata?.labels || {};
    }

    get annotations() {
        return this.config?.metadata?.annotations || {};
    }

}

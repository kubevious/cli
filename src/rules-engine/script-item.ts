import { K8sManifest } from "../manifests/k8s-manifest";


export class ScriptItem
{
    private _manifest: K8sManifest;

    constructor(manifest: K8sManifest) {
        this._manifest = manifest;
    }

    get config() {
        return this._manifest.config;
    }

    get manifest() {
        return this._manifest;
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

    get labels() {
        return this.config?.metadata?.labels || {};
    }

    get annotations() {
        return this.config?.metadata?.annotations || {};
    }

}

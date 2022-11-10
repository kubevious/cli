export type KindType = string;

export type ScopeFinalizer = () => void;

export class Scope {
    private _query: BaseScopeQuery | null = null; 
    private _finalizers: ScopeFinalizer[] = [];

    get query() {
        return this._query;
    }

    registerFinalizer(finalizer: ScopeFinalizer)
    {
        this._finalizers.push(finalizer);
    }

    finalize() {
        for(const finalizer of this._finalizers)
        {
            finalizer();
        }
    }

    setupQuery(query: BaseScopeQuery)
    {
        this._query = query;
    }

}

export enum ScopeQueryKind
{
    K8s = 'K8s'
}

export interface BaseScopeQuery
{
    kind: ScopeQueryKind,
}

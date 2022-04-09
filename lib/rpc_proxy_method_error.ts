export class RpcProxyMethodError extends Error {

    constructor (message?: string) {
        super(message ||
        'RPC method call error, you may need to add the @RpcCall () decorator')
    }

}

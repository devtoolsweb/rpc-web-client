export class RpcProxyMethodError extends Error {
  constructor () {
    super(
      'RPC method call error, you may need to add the @RpcCall () decorator'
    )
  }
}

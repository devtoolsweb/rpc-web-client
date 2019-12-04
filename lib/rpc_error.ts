export class RpcMethodNotImplementedError extends Error {
  constructor () {
    super(
      'The Rpc method is not implemented, you may need to add a @RpcCall() decorator.'
    )
  }
}

import { IRpcMessageArgs, IRpcStandardResult } from '@aperos/rpc-common'
import { RpcCall, RpcMethodNotImplementedError, RpcProxy } from '../../dist'

export class TestClass extends RpcProxy {
  @RpcCall()
  async testMethod (_: IRpcMessageArgs): Promise<IRpcStandardResult<string>> {
    throw new RpcMethodNotImplementedError()
  }
}

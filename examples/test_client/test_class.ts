import {} from '@aperos/rpc-common'
import { RpcCall, RpcProxy, RpcProxyMethodError, RpcCallArgs } from '../../lib'

export class TestClass extends RpcProxy {
  @RpcCall()
  async testMethod (_args?: RpcCallArgs, result?: string): Promise<string> {
    if (result) {
      return `Decorated value: {${result}}`
    }
    throw new RpcProxyMethodError()
  }
}

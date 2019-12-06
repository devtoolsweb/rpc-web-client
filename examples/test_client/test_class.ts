import {
  IRpcMessageArgs,
  IRpcStandardResult,
  RpcStandardResult
} from '@aperos/rpc-common'
import { RpcCall, RpcProxy, RpcProxyMethodError } from '../../lib'

export class TestClass extends RpcProxy {
  @RpcCall()
  async testMethod (
    _args?: IRpcMessageArgs,
    result?: IRpcStandardResult<string>
  ): Promise<IRpcStandardResult<string>> {
    if (result) {
      return new RpcStandardResult<string>({
        ...result,
        value: `Decorated value: {${result.value}}`
      })
    }
    throw new RpcProxyMethodError()
  }
}

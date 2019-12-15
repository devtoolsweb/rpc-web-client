import {} from '@aperos/rpc-common'
import { RpcCall, RpcProxy, RpcProxyMethodError, RpcCallArgs } from '../../lib'

export interface ITestClassCalcSumArgs {
  a: number
  b: number
}

export class TestClass extends RpcProxy {
  @RpcCall()
  async calcSum (
    _args?: ITestClassCalcSumArgs,
    result?: number
  ): Promise<number> {
    if (result) {
      return result
    }
    throw new RpcProxyMethodError()
  }

  @RpcCall()
  async testMethod (_args?: RpcCallArgs, result?: string): Promise<string> {
    if (result) {
      return `Decorated value: {${result}}`
    }
    throw new RpcProxyMethodError()
  }
}

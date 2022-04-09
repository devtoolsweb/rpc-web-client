import { IRpcError } from '@devtoolsweb/rpc-common'
import { RpcCall, RpcProxy, RpcProxyMethodError } from '../../lib'

interface ITestMethodParams {
  hello: string
}

interface ICalcSumParams {
  a: number
  b: number
}

export class TestClass extends RpcProxy {
  @RpcCall()
  async calcSum(_params?: ICalcSumParams, result?: number): Promise<number> {
    if (result) {
      return result
    } else {
      throw new RpcProxyMethodError()
    }
  }

  @RpcCall()
  async testMethod(
    _params?: ITestMethodParams,
    result?: string
  ): Promise<string> {
    if (result) {
      return `Decorated value: {${result}}`
    }
    throw new RpcProxyMethodError()
  }

  @RpcCall()
  async getErrorResult(
    _params?: ITestMethodParams,
    result?: number
  ): Promise<number> {
    if (result) {
      return result
    }
    throw new RpcProxyMethodError()
  }

  @RpcCall()
  async methodWithException(): Promise<number | IRpcError> {
    return -1
  }
}

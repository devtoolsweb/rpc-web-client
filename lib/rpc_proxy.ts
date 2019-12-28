import { RpcRequest, RpcUtils } from '@aperos/rpc-common'
import { IRpcConnection } from './rpc_connection'
import { RpcProxyMethodError } from './rpc_proxy_method_error'

export interface IRpcProxy {
  readonly apiKey?: string
  readonly connection: IRpcConnection
  readonly domain: string
  readonly throwError: boolean
}

export type RpcCallArgs = Record<string | symbol, any>

export interface IRpcCallOpts {
  domain?: string
  messageTtl?: number
  verb?: string
}

export interface IRpcProxyOpts {
  apiKey?: string
  connection: IRpcConnection
  domain?: string
  throwError?: boolean
}

export class RpcProxy implements IRpcProxy {
  readonly apiKey?: string
  readonly connection: IRpcConnection
  readonly domain: string
  readonly throwError: boolean

  constructor(p: IRpcProxyOpts) {
    this.connection = p.connection
    this.domain = p.domain || ''
    this.throwError = p.throwError === true
    p.apiKey && (this.apiKey = p.apiKey)
  }
}

export function RpcCall(p?: string | IRpcCallOpts) {
  let [domain, verb, ttl] = ['', '', 0]
  if (typeof p === 'string') {
    ;[domain, verb] = RpcUtils.parseMethod(p)
  } else if (p) {
    ;[domain, verb, ttl] = [p.domain || '', p.verb || '', p.messageTtl || 0]
  }

  return (target: Object, key: string, descriptor: PropertyDescriptor) => {
    if (!(target instanceof RpcProxy)) {
      throw new Error(
        `Target class for @RpcCall() must be and instance of RpcProxy`
      )
    }
    const oldValue = descriptor.value
    descriptor.value = async function(this: IRpcProxy, args: RpcCallArgs) {
      const apiKey = this.apiKey
      ttl = ttl || this.connection.messageTtl
      const request = new RpcRequest({
        ...(ttl > 0 ? { ttl } : {}),
        id: 'auto',
        method: `${domain || this.domain}.${verb || key}`,
        params: {
          ...(apiKey ? { apiKey } : {}),
          ...args
        }
      })
      const response = await this.connection.send(request)
      const e = response.error
      if (e) {
        if (this.throwError) {
          throw new RpcProxyMethodError(
            `RPC method call error (${e.code}: ${e.message})`
          )
        } else {
          return oldValue.call(this, null, null, e)
        }
      } else {
        return await oldValue.call(this, null, response.result)
      }
    }
  }
}

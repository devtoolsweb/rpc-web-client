import { RpcRequest, RpcUtils } from '@aperos/rpc-common'
import { IRpcConnection } from './rpc_connection'
import { RpcProxyMethodError } from './rpc_proxy_method_error'

export interface IRpcProxy {
  readonly apiKey?: string
  readonly connection: IRpcConnection
  readonly domain: string
}

export type RpcCallArgs = Record<string | symbol, any>

export interface IRpcCallProps {
  domain?: string
  messageTtl?: number
  verb?: string
}

export interface IRpcProxyProps {
  apiKey?: string
  connection: IRpcConnection
  domain?: string
}

export class RpcProxy implements IRpcProxy {
  readonly apiKey?: string
  readonly connection: IRpcConnection
  readonly domain: string

  constructor (p: IRpcProxyProps) {
    this.connection = p.connection
    this.domain = p.domain || ''
    p.apiKey && (this.apiKey = p.apiKey)
  }
}

export function RpcCall (p?: string | IRpcCallProps) {
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
    descriptor.value = async function (this: IRpcProxy, args: RpcCallArgs) {
      const apiKey = this.apiKey
      ttl = ttl || this.connection.messageTtl
      const request = new RpcRequest({
        ...(ttl > 0 ? { ttl } : {}),
        id: 'auto',
        method: `${this.domain || domain}.${verb || key}`,
        params: {
          ...(apiKey ? { apiKey } : {}),
          ...args
        }
      })
      const response = await this.connection.send(request)
      const e = response.error
      if (e) {
        throw new RpcProxyMethodError(
          `RPC method call error (${e.code}: ${e.message})`
        )
      }
      return await oldValue(null, response.result)
    }
  }
}

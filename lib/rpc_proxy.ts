import { IRpcMessageArgs, RpcMessage } from '@aperos/rpc-common'
import { IRpcClient, IRpcMessageSendParams } from './rpc_client'

export interface IRpcProxy {
  readonly client: IRpcClient
  readonly domain: string
}

export interface IRpcCallParams {
  domain?: string
  messageTtl?: number
  verb?: string
}

export interface IRpcProxyParams {
  domain?: string
  client: IRpcClient
}

export class RpcProxy implements IRpcProxy {
  readonly client: IRpcClient
  readonly domain: string

  constructor (p: IRpcProxyParams) {
    this.client = p.client
    this.domain = p.domain || ''
  }
}

export function RpcCall (p?: string | IRpcCallParams) {
  return (target: Object, key: string, descriptor: PropertyDescriptor) => {
    if (!(target instanceof RpcProxy)) {
      throw new Error(
        `Target class for @RpcCall() must be and instance of RpcProxy`
      )
    }
    const oldValue = descriptor.value
    descriptor.value = async function (this: IRpcProxy, args: IRpcMessageArgs) {
      let domain = this.domain
      let verb: string = key
      let ttl = this.client.messageTtl
      if (p) {
        if (typeof p === 'string') {
          verb = p || key
        } else {
          p.domain && (domain = p.domain)
          verb = p.verb || key
          p.messageTtl && (ttl = Math.max(100, p.messageTtl))
        }
      }
      const ttlParams = ttl > 0 ? { ttl } : {}
      const message = new RpcMessage({ args, domain, verb, ...ttlParams })
      const sp: IRpcMessageSendParams = { message }
      const result = await this.client.send(sp)
      return await oldValue(null, result)
    }
  }
}

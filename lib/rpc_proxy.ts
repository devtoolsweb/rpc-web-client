// TODO: Make client the event emitter and use events instead of on*() handlers.

import {
  IRpcResult,
  ISocketMessage,
  RpcMessage,
  RpcMessageArgs,
  RpcResult
} from '@aperos/rpc-common'
import { IRpcClient, IRpcMessageSendParams } from './rpc_client'

export interface IRpcProxy {
  readonly client: IRpcClient
}

export interface IRpcCallParams {
  alias?: string
  messageTtl?: number
}

export function RpcCall (p?: string | IRpcCallParams) {
  return (target: Object, key: string, descriptor: PropertyDescriptor) => {
    let t = target
    while (t && t.constructor.name !== RpcProxy.name) {
      t = Object.getPrototypeOf(t)
    }
    const namespace = target.constructor.name
    if (!t) {
      throw new Error(`Class '${namespace}' is not inherited from RpcProxy`)
    }
    descriptor.value = async function (this: IRpcProxy, args: RpcMessageArgs) {
      let verb: string = key
      let ttl = this.client.messageTtl
      if (p) {
        // For backward compatibility
        if (typeof p === 'string') {
          verb = p || key
        } else {
          verb = p.alias || key
          p.messageTtl && (ttl = Math.max(100, p.messageTtl))
        }
      }
      const ttlParams = ttl > 0 ? { ttl } : {}
      const message = new RpcMessage({ args, namespace, verb, ...ttlParams })
      const sp: IRpcMessageSendParams = { message }
      if (args.onResponse) {
        sp.onResponse = (m?: ISocketMessage) => {
          args.onResponse!({ result: m as IRpcResult, verb })
        }
      }
      sp.onTimeout = () => {
        if (args.onTimeout) {
          args.onTimeout({ verb })
        }
        return new RpcResult({
          comment: `RPC request timeout: ${namespace}.${verb}()`,
          id: message.id,
          status: 'Timeout'
        })
      }
      return await this.client.send(sp)
    }
  }
}

export interface IRpcProxyParams {
  client: IRpcClient
}

export class RpcProxy implements IRpcProxy {
  readonly client: IRpcClient

  constructor (p: IRpcProxyParams) {
    this.client = p.client
  }
}

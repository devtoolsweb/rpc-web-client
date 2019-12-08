import {
  IRpcMessageArgs,
  IRpcMessageParams,
  RpcMessage
} from '@aperos/rpc-common'
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

const rpcMethodQNSeparators = ['@', '::', '\\/', '\\\\', '\\.']
const rpcMethodQNRegexp = new RegExp(
  `^([a-z_]\\w*)(?:(?:${rpcMethodQNSeparators.join('|')})([a-z_]\\w+))?$`,
  'i'
)
const rpcMethodQNForm = `[domain<${rpcMethodQNSeparators.join('|')}>]verb'`

export function RpcCall (p?: string | IRpcCallParams) {
  let qn = ['', '']
  if (typeof p === 'string') {
    const m = p.match(rpcMethodQNRegexp)
    if (!m) {
      throw new Error(
        `Argument of @RpcCall() must be in form the of ${rpcMethodQNForm}`
      )
    }
    qn = m.slice(1).map(x => x || '')
  } else if (p) {
    qn = [p.domain || '', p.verb || '']
  }
  const [defaultDomain, defaultVerb] = qn

  return (target: Object, key: string, descriptor: PropertyDescriptor) => {
    if (!(target instanceof RpcProxy)) {
      throw new Error(
        `Target class for @RpcCall() must be and instance of RpcProxy`
      )
    }
    const oldValue = descriptor.value
    descriptor.value = async function (this: IRpcProxy, args: IRpcMessageArgs) {
      let ttl = this.client.messageTtl
      const domain = this.domain || defaultDomain
      const verb = defaultVerb || key
      const params: IRpcMessageParams = {
        ...(ttl > 0 ? { ttl } : {}),
        args,
        domain,
        verb
      }
      const message = new RpcMessage(params)
      const sp: IRpcMessageSendParams = { message }
      const result = await this.client.send(sp)
      return await oldValue(null, result)
    }
  }
}

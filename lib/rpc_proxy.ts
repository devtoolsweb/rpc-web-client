import { RpcRequest } from '@aperos/rpc-common'
import { IRpcConnection } from './rpc_connection'

export interface IRpcProxy {
  readonly connection: IRpcConnection
  readonly domain: string
}

export interface IRpcCallProps {
  domain?: string
  messageTtl?: number
  verb?: string
}

export interface IRpcProxyProps {
  connnection: IRpcConnection
  domain?: string
}

export class RpcProxy implements IRpcProxy {
  readonly connection: IRpcConnection
  readonly domain: string

  constructor (p: IRpcProxyProps) {
    this.connection = p.connnection
    this.domain = p.domain || ''
  }
}

const rpcMethodQNSeparators = ['@', '::', '\\/', '\\\\', '\\.']
const rpcMethodQNRegexp = new RegExp(
  `^([a-z_]\\w*)(?:(?:${rpcMethodQNSeparators.join('|')})([a-z_]\\w+))?$`,
  'i'
)
const rpcMethodQNForm = `[domain<${rpcMethodQNSeparators.join('|')}>]verb'`

export function RpcCall (p?: string | IRpcCallProps) {
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
    descriptor.value = async function (this: IRpcProxy, args: any[]) {
      let ttl = this.connection.messageTtl
      const domain = this.domain || defaultDomain
      const verb = defaultVerb || key
      const request = new RpcRequest({
        ...(ttl > 0 ? { ttl } : {}),
        id: 'auto',
        method: `${domain}.${verb}`,
        params: {
          args,
          domain,
          verb
        }
      })
      const result = await this.connection.send(request)
      return await oldValue(null, result)
    }
  }
}

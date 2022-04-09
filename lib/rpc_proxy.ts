import { IRpcConnection } from './rpc_connection'
import { RpcProxyMethodError } from './rpc_proxy_method_error'
import { RpcRequest, RpcUtils } from '@devtoolsweb/rpc-common'

export interface IRpcProxy {
    readonly apiKey?: string
    readonly connection: IRpcConnection
    readonly domain: string
    readonly throwError: boolean
}

export type RpcCallArgs = Record<string | symbol, unknown>

export interface IRpcCallArgs {
    domain?: string
    messageTtl?: number
    verb?: string
}

export interface IRpcProxyArgs {
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

    constructor (p: IRpcProxyArgs) {
        this.connection = p.connection
        this.domain = p.domain || ''
        this.throwError = p.throwError === true
        p.apiKey && (this.apiKey = p.apiKey)
    }

}

export function RpcCall (args?: string | IRpcCallArgs) {
    let p: IRpcCallArgs = {
        domain: '',
        verb: '',
        messageTtl: 0
    }
    if (args) {
        if (typeof args === 'string') {
            const m = RpcUtils.parseMethod(args)
            p.domain = m[0]
            p.verb = m[1]
        }
        else {
            p = args
        }
    }
    let ttl = p.messageTtl

    return (target: object, key: string, descriptor: PropertyDescriptor) => {
        if (!(target instanceof RpcProxy)) {
            throw new Error('Target class for @RpcCall() must be and instance of RpcProxy')
        }
        const oldValue = descriptor.value
        descriptor.value = async function (this: IRpcProxy, args: RpcCallArgs) {
            const apiKey = this.apiKey
            ttl = ttl || this.connection.messageTtl
            const request = new RpcRequest({
                ...(ttl > 0 ? { ttl } : {}),
                id: 'auto',
                method: `${p.domain || this.domain}.${p.verb || key}`,
                params: {
                    ...(apiKey ? { apiKey } : {}),
                    ...args
                }
            })
            const response = await this.connection.send(request)
            const e = response.error
            if (e) {
                if (this.throwError) {
                    throw new RpcProxyMethodError(`RPC method call error (${e.code}: ${e.message})`)
                }
                else {
                    return oldValue.call(this, args, null, e)
                }
            }
            else {
                return oldValue.call(this, args, response.result)
            }
        }
    }
}

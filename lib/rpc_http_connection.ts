import {
  IRpcRequest,
  IRpcResponse,
  RpcResponse,
  RpcError,
  RpcErrorCodeEnum
} from '@aperos/rpc-common'
import { RpcConnection } from './rpc_connection'

export class RpcHttpConnection extends RpcConnection {
  async send(request: IRpcRequest) {
    const body = JSON.stringify(request)
    const connection = this
    const id = request.id
    this.emit('request', { connection, request })
    if (id !== undefined) {
      return new Promise<IRpcResponse>(async resolve => {
        const t = setTimeout(() => {
          this.emit('timeout', { connection, request })
          resolve(
            new RpcResponse({
              id,
              error: new RpcError({
                code: RpcErrorCodeEnum.Timeout,
                message: `Request '${id}' timed out`
              })
            })
          )
        }, request.ttl)
        await this.sendHttpRequest(body).then(async resp => {
          clearTimeout(t)
          if (resp.ok) {
            const json = await resp.json()
            const response = new RpcResponse(RpcResponse.makePropsFromJson(json))
            this.emit('response', { connection, response })
            resolve(response)
          } else {
            const comment =
              resp.type === 'opaque'
                ? 'Opaque response received, maybe this is a CORS problem'
                : resp.statusText || 'Unknown error'
            this.emit('error', { connection, comment })
          }
        })
      })
    } else {
      await this.sendHttpRequest(body)
      return new Promise<IRpcResponse>(resolve => {
        resolve(new RpcResponse({ id: 0 }))
      })
    }
  }

  protected async sendHttpRequest(body: string) {
    return await fetch(this.serverUrl, {
      method: 'POST',
      mode: this.allowCors ? 'cors' : 'no-cors',
      cache: 'no-cache',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      referrer: 'no-referrer',
      body
    })
  }
}

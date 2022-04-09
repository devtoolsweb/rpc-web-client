import { IRpcConnection, RpcConnection } from './rpc_connection'
import { IRpcRequest, IRpcResponse, JsonRpcId, RpcError, RpcErrorCodeEnum, RpcResponse } from '@devtoolsweb/rpc-common'

export type SocketResponseCallback = (response?: IRpcResponse) => unknown

class MessageSink {

    private callback: SocketResponseCallback

    constructor (callback: SocketResponseCallback) {
        this.callback = callback
    }

    capture (r: IRpcResponse) {
        this.callback(r)
    }

}

export class RpcWsConnection extends RpcConnection {

    private isConnected = false

    private readonly sinkMap = new Map<JsonRpcId, MessageSink>()

    private ws?: WebSocket

    async send (request: IRpcRequest) {
        await this.ensureConnectionExists()
        const connection = this as IRpcConnection
        const data = JSON.stringify(request)
        const id = request.id
        const ws = this.ws as WebSocket
        this.emit('request', {
            connection,
            request
        })
        if (id !== undefined) {
            return new Promise<IRpcResponse>(resolve => {
                const t = setTimeout(() => {
                    this.emit('timeout', {
                        connection,
                        request
                    })
                    resolve(new RpcResponse({
                        id,
                        error: new RpcError({
                            code: RpcErrorCodeEnum.Timeout,
                            message: `Request '${id}' timed out`
                        })
                    }))
                }, request.ttl)
                this.sinkMap.set(
                    id,
                    new MessageSink(m => {
                        clearTimeout(t)
                        const response = m as IRpcResponse
                        this.emit('response', {
                            connection,
                            response
                        })
                        resolve(response)
                    })
                )
                ws.send(data)
            })
        }
        else {
            ws.send(data)
            return new Promise<IRpcResponse>(resolve => {
                resolve(new RpcResponse({ id: 0 }))
            })
        }
    }

    protected async ensureConnectionExists () {
        if (!this.isConnected) {
            await this.reconnect()
        }
    }

    protected async reconnect () {
        if (this.ws) {
            this.ws.close()
            delete this.ws
        }
        return new Promise<void>((resolve, reject) => {
            const ws = new WebSocket(this.serverUrl)
            ws.addEventListener('close', () => {
                this.isConnected = false
            })
            ws.addEventListener('error', () => {
                reject(`WebSocket connection to '${this.serverUrl}' failed`)
            })
            ws.addEventListener('message', (event: MessageEvent) => {
                const response = JSON.parse(event.data) as IRpcResponse
                const sink = this.sinkMap.get(response.id)
                if (sink) {
                    this.sinkMap.delete(response.id)
                    sink.capture(response)
                }
            })
            ws.addEventListener('open', () => {
                this.isConnected = true
                this.ws = ws
                resolve()
                this.emit('open', { connection: this })
            })
        })
    }

}

// TODO: Make client the event emitter.

import { IRpcMessage } from '@aperos/rpc-common'
import { ISocketMessageSendParams, SocketConnection } from './socket_connection'

export interface IRpcMessageSendParams extends ISocketMessageSendParams {
  readonly message: IRpcMessage
}

export interface IRpcClient {
  readonly messageTtl: number
  send(p: IRpcMessageSendParams): Promise<object>
}

export interface IRpcClientParams {
  readonly messageTtl?: number
  readonly serverUrl: string
}

export class RpcClient implements IRpcClient {
  readonly messageTtl: number

  private readonly connection: SocketConnection

  constructor (p: IRpcClientParams) {
    this.connection = new SocketConnection({ serverUrl: p.serverUrl })
    this.connection.on('open', () => {
      console.log('>>>>> WebSocket connection updated')
    })
    this.messageTtl = p.messageTtl || -1
  }

  send (p: IRpcMessageSendParams): Promise<object> {
    return this.connection.send(p)
  }
}

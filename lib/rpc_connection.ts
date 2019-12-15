import { IRpcMessage, IRpcResponse, IRpcRequest } from '@aperos/rpc-common'
import { IBaseEvents, ITypedEventEmitter } from '@aperos/event-emitter'

export interface IRpcConnectionEvents extends IBaseEvents {
  readonly open: (conn: IRpcConnection) => void
  readonly request: (conn: IRpcConnection, m: IRpcRequest) => void
  readonly response: (conn: IRpcConnection, m: IRpcResponse) => void
  readonly timeout: (conn: IRpcConnection, m: IRpcMessage) => void
}

export interface IRpcConnection
  extends ITypedEventEmitter<IRpcConnectionEvents> {
  readonly messageTtl: number
  readonly serverUrl: string
  send(m: IRpcRequest): Promise<IRpcResponse>
}

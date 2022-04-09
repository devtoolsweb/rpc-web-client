import { IRpcConnection, RpcHttpConnection, RpcWsConnection } from '../../lib'
import { TestClass } from './test_class'

const config = {
    httpPort: 3002,
    host: 'localhost',
    useWebSocket: true,
    wsPort: 3001
}

const logMessage = (message: string) => {
    const el = document.createElement('div')
    el.textContent = message
    const messages = document.getElementById('messages') as HTMLDivElement
    messages.appendChild(el)
}

window.addEventListener('load', async () => {
    const { httpPort, host, wsPort, useWebSocket } = config
    if (useWebSocket) {
        logMessage('Using web sockets')
    }
    const connection: IRpcConnection = useWebSocket
        ? new RpcWsConnection({ serverUrl: `ws://${host}:${wsPort}` })
        : new RpcHttpConnection({
            allowCors: true,
            serverUrl: `http://${host}:${httpPort}`
        })
    connection
        .on('error', event => {
            logMessage(`Connection error: ${event.comment}`)
        })
        .on('request', event => {
            logMessage(`Client sent a request: ${JSON.stringify(event.request)}`)
        })

    let isConnected = false
    try {
        const res = await connection.ping()
        if (res.error) {
            throw `Ping failed: ${res.error.message}`
        }
        logMessage(`Server response: ${res.result as string}`)
        isConnected = true
    }
    catch (e) {
        logMessage(e as string)
    }

    if (isConnected) {
        const tc = new TestClass({
            connection,
            domain: 'TestDomain',
            throwError: true
        })
        await testMethods(tc)
    }
})

const testMethods = async (tc: TestClass) => {
    try {
        const sum = await tc.calcSum({
            a: Math.random(),
            b: Math.random()
        })
        logMessage(`calcSum(): ${sum}`)
        const hello = await tc.testMethod({ hello: 'hello' })
        logMessage(`testMethod(): ${hello}`)
        const n = await tc.getErrorResult()
        logMessage(`getErrorResult(): ${n}`)
    }
    catch (e) {
        logMessage(`Error: ${(e as Error).message}`)
    }

    try {
        await tc.methodWithException()
    }
    catch (e) {
        logMessage(`Error: ${(e as Error).message}`)
    }
}

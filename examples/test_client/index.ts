import { RpcClient } from '../../lib'
import { TestClass } from './test_class'

window.addEventListener('load', async () => {
  const client = new RpcClient({ serverUrl: 'ws://localhost:3000' })
  client.on('message', (_, message) => {
    console.log('Client sent a message:', message)
  })

  const tc = new TestClass({ client, domain: 'TestDomain' })
  const result = await tc.testMethod({ hello: 123 })
  console.log(result.value)
})

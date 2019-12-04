import { RpcClient } from '../../dist'
import { TestClass } from './test_class'

window.addEventListener('load', async () => {
  const client = new RpcClient({ serverUrl: 'ws://localhost:3000' })
  const tc = new TestClass({ client })
  const result = await tc.testMethod({})
  console.log(result.value)
})

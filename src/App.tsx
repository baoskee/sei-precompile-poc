import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { createWalletClient, custom, defineChain } from "viem"

import './App.css'

const sei_mainnet = defineChain({
  id: 1329,
  name: 'Sei Mainnet',
  nativeCurrency: { name: 'Sei', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://evm-rpc.sei-apis.com'],
    },
  },
})

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: any;
  }
}

function App() {

  const on_sign_click = async () => {
    const client = createWalletClient({
      chain: sei_mainnet,
      transport: custom(window.ethereum!)
    })
    const [addr] = await client.requestAddresses();
    console.log(addr)
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={on_sign_click}>
          Increment count
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App

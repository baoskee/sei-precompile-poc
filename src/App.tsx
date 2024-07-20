import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import abi from "../abi.json"
import { ethers, toUtf8Bytes, toUtf8String } from "ethers";
import { useQuery } from '@tanstack/react-query';

import './App.css'

const CW_PRECOMPILE = "0x0000000000000000000000000000000000001002";

const COUNTER_ADDR = "sei1tfh5qe4l7ej8l47zheckg2h58hunzzcqgydpp9huk9x45tme90aq2a2lz4";

const COSMOS_RPC = "https://sei-rpc.polkachu.com/"

const EVM_RPC = "https://evm-rpc.sei-apis.com";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: any;
  }
}

function App() {

  const counter = useQuery({
    queryKey: ['counter'],
    queryFn: async () => {
      // Using MetaMask as the signer and provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // Create a contract with the signer
      const contract = new ethers.Contract(
        CW_PRECOMPILE,
        abi,
        signer
      );
      const query_msg = { counter: {} }
      const queryResponse = await contract.query(
        COUNTER_ADDR,
        toUtf8Bytes(JSON.stringify(query_msg))
      );

      return Number(toUtf8String(queryResponse));
    }
  });
  const on_sign_click = async () => {
    // Using MetaMask as the signer and provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Create a contract with the signer
    const contract = new ethers.Contract(
      CW_PRECOMPILE,
      abi,
      signer
    );
    const executeMsg = { increment: {} };
    const executeResponse = await contract.execute(
      COUNTER_ADDR,
      toUtf8Bytes(JSON.stringify(executeMsg)),
      toUtf8Bytes(JSON.stringify([])) // Used for sending funds if needed
    );
    console.log(executeResponse)
 
    const cosmos_tx_res = await fetch(
      EVM_RPC,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "id": 1,
          "jsonrpc": "2.0",
          "method": "sei_getCosmosTx",
          "params": [executeResponse.hash]
        })
      }
    )
    const tx_hash = (await cosmos_tx_res.json()).result
    console.log(tx_hash)

    const tx_res = await fetch(`${COSMOS_RPC}/tx?hash=${tx_hash}`)
    const body = await tx_res.json()
    console.log(body)

    const events = body.tx_result.events;
    console.log(events)

    // invalidate the query
    counter.refetch();
  }

  const { data } = useQuery({
    queryKey: ["sei_addr"],
    queryFn: async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const hex_addr = await signer.getAddress();

    const response = await fetch(EVM_RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "method": "sei_getSeiAddress",
        "params": [
          hex_addr
        ],
        "id": 1
      })
    });

    return response.json();
  }});

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
          {counter.data}
        </p>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        {data && <p>
          Sei address: {data.result}
        </p>}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App

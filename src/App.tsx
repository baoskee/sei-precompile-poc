import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import abi from "../abi.json"
import { ethers, toUtf8Bytes, toUtf8String } from "ethers";
import { useQuery } from '@tanstack/react-query';
import { EVM_RPC, cosmos_tx_hash } from './lib';

import './App.css'

const CW_PRECOMPILE = "0x0000000000000000000000000000000000001002";

const COUNTER_ADDR = "sei1tfh5qe4l7ej8l47zheckg2h58hunzzcqgydpp9huk9x45tme90aq2a2lz4";

const COSMOS_RPC = "https://sei-rpc.polkachu.com/"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: any;
  }
}

function App() {

  // MARK: - Query counter
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

  // MARK: - Sign and execute

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

    const populate_tx = await signer.populateTransaction({
      to: CW_PRECOMPILE,
      data: contract.interface.encodeFunctionData("execute", [
        COUNTER_ADDR,
        toUtf8Bytes(JSON.stringify(executeMsg)),
        toUtf8Bytes(JSON.stringify([]))
      ])
    })
    console.log("populate_tx", populate_tx)
    const gas_limit = await signer.estimateGas(populate_tx)
    console.log("gas_limit", gas_limit)

    // metamask does not support eth_signTransaction 
    // const sign_tx = await signer.signTransaction(populate_tx)

    const executeResponse = await contract.execute(
      COUNTER_ADDR,
      toUtf8Bytes(JSON.stringify(executeMsg)),
      toUtf8Bytes(JSON.stringify([])) // Used for sending funds if needed
    );
    console.log(executeResponse);

    const evm_tx_res = await fetch(
      EVM_RPC,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "eth_getTransactionByHash",
          "params": [executeResponse.hash]
        })
      }
    )
    const evm_tx_body = await evm_tx_res.json()
    console.log("evm_tx_body", evm_tx_body)
    // decode result.input as bytes
    const input = evm_tx_body.result.input
    console.log("input", input)
    const decoded = contract.interface.decodeFunctionData("execute", input)
    console.log("decoded", decoded)

    const tx_hash = await cosmos_tx_hash(executeResponse.hash)
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
    }
  });

  // MARK: Instantiate pre-compile

  const on_instantiate_click = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      CW_PRECOMPILE,
      abi,
      signer
    );
    const instantiate_msg = {}

    const res = await contract.instantiate(
      // code ID
      5004,
      // admin
      "",
      // init msg
      toUtf8Bytes(JSON.stringify(instantiate_msg)),
      // label
      "counter_contract",
      // funds
      toUtf8Bytes(JSON.stringify([]))
    );
    console.log(res)
  }

  // MARK: Excute multiple
  const on_execute_multiple_click = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      CW_PRECOMPILE,
      abi,
      signer
    );
    const res = await contract.execute_batch(
      [
        {
          contractAddress: COUNTER_ADDR,
          msg: toUtf8Bytes(JSON.stringify({ increment: {} })),
          coins: toUtf8Bytes(JSON.stringify([]))
        },
        {
          contractAddress: COUNTER_ADDR,
          msg: toUtf8Bytes(JSON.stringify({ increment: {} })),
          coins: toUtf8Bytes(JSON.stringify([]))
        }
      ]
    )
    console.log("execute_multiple", res)

    const cosmos_tx = await cosmos_tx_hash(res.hash)
    console.log("cosmos_tx", cosmos_tx)

    counter.refetch();
  }

  // MARK: View code

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
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px"
        }}>
          <button onClick={on_instantiate_click}>
            Instantiate
          </button>
          <button onClick={on_sign_click}>
            Increment count
          </button>
          <button onClick={on_execute_multiple_click}>
            Execute multiple
          </button>
        </div>

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

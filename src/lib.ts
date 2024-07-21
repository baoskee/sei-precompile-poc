
export const EVM_RPC = "https://docs-demo.sei-pacific.quiknode.pro/";

export const cosmos_tx_hash = async (eth_hash: string) => {
  const res = await fetch(
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
        "params": [eth_hash]
      })
    }
  )
  const json = await res.json();
  return json.result;
}
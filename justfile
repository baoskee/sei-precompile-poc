# See https://cheatography.com/linux-china/cheat-sheets/justfile/
account := "tailwind-test"
chain_id := "pacific-1"
rpc := "https://sei-rpc.polkachu.com/"
evm_rpc := "https://evm-rpc.sei-apis.com"

max_gas_deploy := "10000000"

build target: 
  echo "Building {{target}}...."
  cd contracts/{{target}} && cargo wasm 

build-opt:
  rm -rf artifacts
  rm -rf target
  docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.15.0

# get code id from deployment
deploy target_filepath:
  seid tx wasm store {{target_filepath}} \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --gas {{max_gas_deploy}} \
    --fees 500000usei

instantiate code_id msg:
  seid tx wasm instantiate {{code_id}} "{{msg}}" \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --label {{code_id}} \
    --no-admin \
    --gas 500000 \
    --fees 250000usei

cw-query contract_addr query_msg:
  seid q wasm contract-state smart {{contract_addr}} '{{query_msg}}' \
    --node {{rpc}} \
    --output json | jq

cwx contract_addr execute_msg:
  seid tx wasm execute {{contract_addr}} '{{execute_msg}}' \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --gas 250000 \
    --fees 125000usei

hash tx_hash:
  seid query tx {{tx_hash}} \
    --node {{rpc}} \
    --output json | jq

factory-new denom:
  seid tx tokenfactory create-denom {{denom}} \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --fees 4000usei

factory-mint amount denom:
  seid tx tokenfactory mint {{amount}}{{denom}} \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --fees 4000usei

factory-admin denom:
  seid query tokenfactory denom-authority-metadata {{denom}} \
    --node {{rpc}}

factory-set-meta file_path:
  seid tx tokenfactory set-denom-metadata {{file_path}} \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --fees 4000usei

factory-change-admin denom new_admin:
  seid tx tokenfactory change-admin {{denom}} {{new_admin}} \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --fees 4000usei

register-evm-pointer denom:
  seid tx evm register-evm-pointer NATIVE {{denom}} \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --fees 4000usei \
    --evm-rpc {{evm_rpc}}

bank target_addr:
  seid query bank balances {{target_addr}} \
    --node {{rpc}}

bank-send target_addr amount denom:
  seid tx bank send {{account}} {{target_addr}} {{amount}}{{denom}} \
    --from {{account}} \
    --chain-id {{chain_id}} \
    --node {{rpc}} \
    --fees 4000usei

bank-meta denom:
  seid query bank denom-metadata --denom {{denom}} \
    --node {{rpc}} 

test:
  cargo test

# MARK: - .wasm Verify

wasm-info addr:
  seid query wasm contract-state raw {{addr}} 636F6E74726163745F696E666F \
    --node {{rpc}} \
    --output json | jq -r .data | base64 -d | jq

wasm-code addr:
  seid query wasm contract {{addr}} \
    --node {{rpc}} \
    --output json | jq

wasm-verify-code code:
  seid query wasm code {{code}} {{code}}_code.wasm \
    --node {{rpc}}
  shasum -a 256 {{code}}_code.wasm
  rm {{code}}_code.wasm

wasm-verify addr:
  #!/usr/bin/env sh
  code=$(just wasm-code {{addr}} | jq '.contract_info.code_id' | tr -d '"')
  echo "Verifying contract with:
    code_id: $code
    addr: {{addr}}
    rpc: {{rpc}}"
  just wasm-verify-code $code

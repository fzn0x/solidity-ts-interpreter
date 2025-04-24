# 🧩 Solidity TypeScript Interpreter

[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/fzn0x/solidity-ts-interpreter)](https://github.com/fzn0x/solidity-ts-interpreter/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/fzn0x/solidity-ts-interpreter)](https://github.com/fzn0x/solidity-ts-interpreter/commits/main)

This project allows you to run Solidity smart contracts using TypeScript

## 📦 Installation

```bash
npm install --legacy-peer-deps
```

## ⚙️ Setup

### 💻 For Local Development

1. Run a local Hardhat node:
```bash
npm run node
```

2. In a separate terminal, deploy your contract:
```bash
npm run deploy
```

### 🧪 For Sepolia Testnet Deployment

1. Create a `.env` file in the root directory with the following content:
```
INFURA_API_KEY=your_infura_api_key_here
PRIVATE_KEY=your_private_key_here
```

2. Get some Sepolia ETH from a faucet like [Sepolia Faucet](https://sepoliafaucet.com/)

3. Deploy to Sepolia:
```bash
npm run deploy:sepolia
```

### 🚀 For Ethereum Mainnet Deployment

⚠️ **WARNING: This will use REAL ETH. Make sure you know what you're doing!** ⚠️

1. Create a `.env` file in the root directory with the following content:
```
INFURA_API_KEY=your_infura_api_key_here
PRIVATE_KEY=your_private_key_here
```

2. Make sure your wallet has enough ETH to cover the deployment gas costs.

3. Deploy to Mainnet:
```bash
npm run deploy:mainnet
```

The deployment script includes:
- Clear warnings when deploying to mainnet
- Timeouts to prevent accidental deployments
- Gas price configuration (default: 0.58 gwei)
- Verification of read-only vs state-changing methods

## 📋 Usage

Check `scripts/deploy.ts`.

```typescript
import { ContractInterpreter } from "../src/ContractInterpreter";

// Example Solidity contract
const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MySmartContract {
    uint256 public myValue;

    constructor() {
        myValue = 42;
    }

    function setMyValue(uint256 newValue) public {
        myValue = newValue;
    }
}
`;

async function main() {
    // Create interpreter
    const interpreter = new ContractInterpreter(contractSource, 'MySmartContract');
    
    // Compile contract
    const runner = await interpreter.compile();
    
    // Deploy contract
    await runner.deploy();
    
    // Call contract function
    const currentValue = await runner.call('myValue');
    console.log('Current value:', currentValue.toString());
    
    // Set new value
    await runner.call('setMyValue', 100);
    
    // Verify changes
    const newValue = await runner.call('myValue');
    console.log('New value:', newValue.toString());
}

main().catch(console.error);
```

## 🔧 Requirements

- Node.js v20.19.0 or newer (Node.js v18 is reaching End-Of-Life on April 30, 2025.)
- Local Hardhat node HTTP and WebSocket JSON-RPC server running at http://127.0.0.1:8545/
- NPM 10.8.2 or newer
- For testnet/mainnet: Infura API key and wallet with ETH

## ✨ Features

- Solidity contract compilation
- Contract deployment to supported networks by Infura (Local, Testnet, Mainnet)
- Interaction with deployed contracts
- Support for all Solidity contract functions
- Gas price management for mainnet transactions

## ❓ FAQs

'failed with 8856989 gas: max fee per gas less than block base fee: address 0xC08314D6E1e1CfF0787a51a12F7eEB8FF9921eDC, maxFeePerGas: 580000000, baseFee: 600524959'

Answer> Modify `hardhat.config.cjs` gasPrice: 580000000 to gasPrice: 600524959

'Can we use OpenZeppelin or Solidity libraries?'

Answer> This is the future of iteration I'm looking for, I will put this into consideration

## 💰 Donation

You can donate to my main address fzn0x.eth / 0xC08314D6E1e1CfF0787a51a12F7eEB8FF9921eDC

## 📄 License

MIT 
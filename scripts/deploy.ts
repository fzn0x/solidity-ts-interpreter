import { ContractInterpreter } from "../src/ContractInterpreter";

async function main() {
  // Get network parameter from command line
  const networkName = getNetworkName();
  
  const contractSource = `
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;

  contract TestContract {
      uint256 public value;

      constructor() {
          value = 42;
      }

      function setValue(uint256 newValue) public {
          value = newValue;
      }
  }
  `;

  console.log("Creating interpreter...");
  const interpreter = new ContractInterpreter(contractSource, 'TestContract');
  
  console.log("Compiling contract...");
  const runner = await interpreter.compile(networkName);
  
  console.log("Deploying contract...");
  await runner.deploy();
  
  const address = await runner.getAddress();
  console.log("Contract deployed to:", address);
  
  // Simple explorer link based on network
  console.log("\n📋 Contract Explorer:");
  
  if (networkName === "mainnet") {
    console.log(`https://etherscan.io/address/${address}`);
  } else if (networkName === "sepolia") {
    console.log(`https://sepolia.etherscan.io/address/${address}`);
  } else {
    console.log(`Check if you are running on localhost: http://localhost:8545/#/address/${address} or use 
curl 'http://localhost:8545/#/address/${address}' --data-raw '{"jsonrpc":"2.0","method":"net_listening","params":[],"id":1}'`);
    console.log(`(For testnet deployment, run: npm run deploy:sepolia)`);
    console.log(`(For mainnet deployment, run: npm run deploy:mainnet)`);
  }
  
  console.log("\nTesting contract...");
  const currentValue = await runner.call('value');
  console.log("Initial value:", currentValue.toString());
  
  // Only modify state on non-mainnet networks by default
  if (networkName !== "mainnet") {
    await runner.call('setValue', 100);
    const newValue = await runner.call('value');
    console.log("New value:", newValue.toString());
  } else {
    console.log("Skipping state-modifying calls on mainnet for safety. To run them, modify the script.");
  }
}

// Helper function to get the network name from command line arguments
function getNetworkName(): string {
  const networkArg = process.argv.find(arg => arg.startsWith('--network='));
  if (networkArg) {
    return networkArg.split('=')[1];
  }
  
  // Also check for Hardhat-style network parameter
  const networkIndex = process.argv.indexOf('--network');
  if (networkIndex !== -1 && networkIndex + 1 < process.argv.length) {
    return process.argv[networkIndex + 1];
  }
  
  return 'localhost'; // Default to localhost
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
import { ethers } from "ethers";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface CompiledContract {
    abi: any[];
    bytecode: string;
}

interface NetworkConfig {
    name: string;
    rpcUrl: string;
    privateKey: string;
    gasPrice?: bigint;
}

export class ContractRunner {
    private contract: CompiledContract;
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contractInstance?: ethers.Contract;
    private networkName: string;

    constructor(contract: CompiledContract, networkName: string = "localhost") {
        if (!contract.bytecode || !contract.abi) {
            throw new Error('Invalid contract: missing bytecode or ABI');
        }
        this.contract = contract;
        this.networkName = networkName;
        
        // Set up network configuration
        const network = this.getNetworkConfig(networkName);
        
        // Connect to the appropriate network
        this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
        this.wallet = new ethers.Wallet(network.privateKey, this.provider);
        
        console.log(`Using network: ${network.name}`);
    }

    private getNetworkConfig(networkName: string): NetworkConfig {
        // Get the default local private key
        const localPrivateKey = process.env.LOCAL_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        
        // Get the private key from environment variables
        const privateKey = process.env.PRIVATE_KEY || localPrivateKey;
        
        // Get the Infura API key
        const infuraApiKey = process.env.INFURA_API_KEY || "";
        
        // Define available networks
        const networks: Record<string, NetworkConfig> = {
            localhost: {
                name: "Hardhat Local",
                rpcUrl: "http://localhost:8545",
                privateKey: localPrivateKey
            },
            sepolia: {
                name: "Sepolia Testnet",
                rpcUrl: `https://sepolia.infura.io/v3/${infuraApiKey}`,
                privateKey: privateKey
            },
            mainnet: {
                name: "Ethereum Mainnet",
                rpcUrl: `https://mainnet.infura.io/v3/${infuraApiKey}`,
                privateKey: privateKey,
                gasPrice: BigInt(580000000) // 0.58 gwei
            }
        };
        
        // Return the selected network config or default to localhost
        return networks[networkName] || networks.localhost;
    }

    public async deploy(): Promise<void> {
        try {
            const address = await this.wallet.getAddress();
            const balance = await this.provider.getBalance(address);
            const network = this.getNetworkConfig(this.networkName);
            
            console.log(`Deploying contract using account ${address}`);
            console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`Network: ${this.networkName}`);
            
            if (balance === BigInt(0)) {
                throw new Error(`Account has no balance. Please fund your account on ${this.networkName} network.`);
            }
            
            // Extra warning for mainnet deployments
            if (this.networkName === 'mainnet') {
                console.log('\x1b[31m%s\x1b[0m', '⚠️ WARNING: You are deploying to MAINNET! This will use REAL ETH! ⚠️');
                console.log('\x1b[31m%s\x1b[0m', 'Using gas price: ' + ethers.formatUnits(network.gasPrice || BigInt(0), 'gwei') + ' gwei');
                // 5 second delay to give user a chance to abort
                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log('Proceeding with deployment...');
            }
            
            const factory = new ethers.ContractFactory(
                this.contract.abi,
                this.contract.bytecode,
                this.wallet
            );

            // Use the network-specific gas price for mainnet
            const deployOptions = this.networkName === 'mainnet' ? 
                { gasPrice: network.gasPrice } : {};
                
            const contract = await factory.deploy(deployOptions);
            console.log("Contract deployment transaction sent:", contract.deploymentTransaction()?.hash);
            
            if (this.networkName === 'mainnet') {
                console.log('Waiting for transaction confirmation. This may take a while...');
            }
            
            await contract.waitForDeployment();
            this.contractInstance = contract as ethers.Contract;
        } catch (error) {
            console.error('Deployment error:', error);
            throw error;
        }
    }

    public async call(methodName: string, ...args: any[]): Promise<any> {
        if (!this.contractInstance) {
            throw new Error('Contract not deployed yet');
        }

        const method = this.contractInstance[methodName];
        if (typeof method !== 'function') {
            throw new Error(`Method ${methodName} not found in contract`);
        }

        // Add gas price for mainnet transactions that modify state
        if (this.networkName === 'mainnet') {
            const network = this.getNetworkConfig('mainnet');
            
            // Check if this is a read or write operation
            const isReadOnly = await this.isReadOnlyMethod(methodName);
            
            if (!isReadOnly) {
                console.log('\x1b[31m%s\x1b[0m', `⚠️ WARNING: You are executing a state-changing transaction on MAINNET!`);
                console.log('\x1b[31m%s\x1b[0m', 'Using gas price: ' + ethers.formatUnits(network.gasPrice || BigInt(0), 'gwei') + ' gwei');
                // 3 second delay to give user a chance to abort
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const overrides = { gasPrice: network.gasPrice };
                return await method(...args, overrides);
            }
        }

        return await method(...args);
    }
    
    private async isReadOnlyMethod(methodName: string): Promise<boolean> {
        if (!this.contractInstance) {
            throw new Error('Contract not deployed yet');
        }
        
        try {
            // Try to estimate gas - if it's a view/pure function, it won't consume gas
            const method = this.contractInstance[methodName];
            await method.estimateGas();
            return false; // If we get here, it's not a read-only method
        } catch (error) {
            // If error contains "cannot estimate gas", it might not be a read-only function
            const errorMsg = String(error);
            if (errorMsg.includes('cannot estimate gas')) {
                return false;
            }
            // Otherwise assume it's read-only
            return true;
        }
    }

    public async getAddress(): Promise<string> {
        if (!this.contractInstance) {
            throw new Error('Contract not deployed yet');
        }

        return await this.contractInstance.getAddress();
    }
} 
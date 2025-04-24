import solc from 'solc';
import { ContractRunner } from './ContractRunner';

interface SolcOutput {
    errors?: Array<{
        message: string;
    }>;
    contracts: {
        [key: string]: {
            [key: string]: {
                abi: any[];
                evm: {
                    bytecode: {
                        object: string;
                    };
                };
            };
        };
    };
}

export class ContractInterpreter {
    private readonly contractSource: string;
    private readonly contractName: string;

    constructor(contractSource: string, contractName: string) {
        this.contractSource = contractSource;
        this.contractName = contractName;
    }

    public async compile(networkName: string = 'localhost'): Promise<ContractRunner> {
        const input = {
            language: 'Solidity',
            sources: {
                'contract.sol': {
                    content: this.contractSource
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                }
            }
        };

        const output: SolcOutput = JSON.parse(solc.compile(JSON.stringify(input)));
        
        if (output.errors) {
            throw new Error(`Compilation error: ${output.errors.map((e: { message: string }) => e.message).join('\n')}`);
        }

        const contract = output.contracts['contract.sol'][this.contractName];
        if (!contract || !contract.evm || !contract.evm.bytecode || !contract.evm.bytecode.object) {
            throw new Error('Invalid contract compilation output');
        }

        return new ContractRunner({
            abi: contract.abi,
            bytecode: contract.evm.bytecode.object
        }, networkName);
    }
} 
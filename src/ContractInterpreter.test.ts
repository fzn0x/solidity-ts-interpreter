import { ContractInterpreter } from './ContractInterpreter';

describe('ContractInterpreter', () => {
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

    it('should compile valid contract', async () => {
        const interpreter = new ContractInterpreter(contractSource, 'TestContract');
        const runner = await interpreter.compile();
        expect(runner).toBeDefined();
    });

    it('should throw error for invalid contract', async () => {
        const invalidSource = 'invalid solidity code';
        const interpreter = new ContractInterpreter(invalidSource, 'TestContract');
        await expect(interpreter.compile()).rejects.toThrow();
    });
}); 
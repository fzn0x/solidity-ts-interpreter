import { ContractRunner } from './ContractRunner';

describe('ContractRunner', () => {
    const mockContract = {
        abi: [],
        bytecode: '0x'
    };

    it('should create instance', () => {
        const runner = new ContractRunner(mockContract);
        expect(runner).toBeDefined();
    });

    it('should throw error when calling methods before deployment', async () => {
        const runner = new ContractRunner(mockContract);
        await expect(runner.call('anyMethod')).rejects.toThrow('Contract not deployed yet');
        await expect(runner.getAddress()).rejects.toThrow('Contract not deployed yet');
    });
}); 
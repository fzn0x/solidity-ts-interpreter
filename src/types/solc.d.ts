declare module 'solc' {
    interface SolcInput {
        language: string;
        sources: {
            [key: string]: {
                content: string;
            };
        };
        settings: {
            outputSelection: {
                [key: string]: {
                    [key: string]: string[];
                };
            };
        };
    }

    interface SolcOutput {
        errors?: Array<{
            message: string;
        }>;
        contracts: {
            [key: string]: {
                [key: string]: {
                    abi: any[];
                    bytecode: string;
                };
            };
        };
    }

    function compile(input: string): string;
    function compile(input: SolcInput): SolcOutput;

    const solc: {
        compile: typeof compile;
    };

    export = solc;
} 
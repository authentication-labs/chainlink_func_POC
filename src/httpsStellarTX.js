const https = require('follow-redirects').https;
const StellarSdk = require('@stellar/stellar-sdk');
const fetch = require('node-fetch'); // Ensure to add this package for fetch compatibility in Node.js

const {
    Keypair,
    TransactionBuilder,
    Networks,
    Contract,
    SorobanRpc,
} = StellarSdk;

const { Api, assembleTransaction } = SorobanRpc;

const sourceKeypair = Keypair.fromSecret('SBLQLBCZ2VNLBPZLUNGIK3URB5XFJ7PYKNF4ELIXJWQLH2HNSO77A7PF');
const contractAddress = 'CBFQXUAWSBVHKJPSLYTZJAJ2V2N4PLIO65LU5CEKZJ6N2GLQPCV3CIPK';
const contract = new Contract(contractAddress);

// Fetch account from the network
const fetchAccount = async (publicKey) => {
    const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch account: ${response.statusText}`);
    }
    const accountData = await response.json();
    return new StellarSdk.Account(publicKey, accountData.sequence);
};

// Fetch base fee
const fetchBaseFee = async () => {
    const response = await fetch(`https://horizon-testnet.stellar.org/fee_stats`);
    if (!response.ok) {
        throw new Error(`Failed to fetch fee stats: ${response.statusText}`);
    }
    const feeData = await response.json();
    return feeData.fee_charged.mode; // Using mode as the base fee (value is in stroops).
};

const main = async () => {
    try {
        const sourceAccount = await fetchAccount(sourceKeypair.publicKey());
        const fee = await fetchBaseFee();
        const networkPassphrase = Networks.TESTNET;

        const builtTransaction = new TransactionBuilder(sourceAccount, {
            fee,
            networkPassphrase,
        })
            .setTimeout(30)
            .addOperation(contract.call('increment'))
            .build();

        console.log('Transaction built successfully.');

        // Simulate the transaction
        const simResponse = await simulateTransaction(builtTransaction.toEnvelope().toXDR('base64'));
        if (Api.isSimulationError(simResponse)) {
            throw new Error(simResponse.error);
        }

        // Prepare the transaction
        const preppedTx = assembleTransaction(builtTransaction, simResponse.result).build();
        
        // Sign the transaction
        preppedTx.sign(sourceKeypair);
        const base64Transaction = preppedTx.toEnvelope().toXDR('base64');

        console.log('Transaction prepared and signed successfully.');

        // Submit the transaction
        await submitTransaction(base64Transaction);
    } catch (error) {
        console.error('Error:', error);
    }
};

const simulateTransaction = async (base64Transaction) => {
    const requestBody = {
        jsonrpc: '2.0',
        id: 8675309,
        method: 'simulateTransaction',
        params: {
            transaction: base64Transaction,
            resourceConfig: {
                instructionLeeway: 50000,
            },
        },
    };

    const response = await fetch('https://soroban-testnet.stellar.org:443', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    return jsonResponse;
};

const submitTransaction = async (base64Transaction) => {
    const postData = `tx=${encodeURIComponent(base64Transaction)}`;

    const options = {
        method: 'POST',
        hostname: 'horizon-testnet.stellar.org',
        path: '/transactions',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length,
        },
        maxRedirects: 20,
    };

    const req = https.request(options, (res) => {
        let chunks = [];

        res.on('data', (chunk) => {
            chunks.push(chunk);
        });

        res.on('end', () => {
            const body = Buffer.concat(chunks);
            console.log('Submission Response:', body.toString());
        });

        res.on('error', (error) => {
            console.error('Submission Error:', error);
        });
    });

    req.write(postData);
    req.end();
};

main();

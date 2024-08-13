
const ethers = await import('npm:ethers@6.10.0');
const CONTRACT_ADDRESS = '0x8412FdaA4f4fF2E34FF5955D7650AA8243569B05';
const RPC_URL = "https://polygon-amoy.blockpi.network/v1/rpc/public";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet('', provider);
const functionSelector = '0xd09de08a';
const chainId = await rpcCall('eth_chainId');
const gasPrice = await rpcCall('eth_gasPrice');
const nonce = await rpcCall('eth_getTransactionCount', [signer.address, 'latest']);
const transactionObject = {
  from: signer.address,
  to: CONTRACT_ADDRESS,
  gasPrice: gasPrice,
  nonce: nonce,
  chainId: chainId,
  data: functionSelector
};
transactionObject.gasLimit = await rpcCall('eth_estimateGas', [transactionObject]);
const signedTx = await signer.signTransaction(transactionObject);
const txHash = await rpcCall('eth_sendRawTransaction', [signedTx]);
return Functions.encodeString("success");

CBFQXUAWSBVHKJPSLYTZJAJ2V2N4PLIO65LU5CEKZJ6N2GLQPCV3CIPK


SBLQLBCZ2VNLBPZLUNGIK3URB5XFJ7PYKNF4ELIXJWQLH2HNSO77A7PF
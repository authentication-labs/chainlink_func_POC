async function rpcCall(method, params = []) {
  try {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: 1,
    });
    const response = await fetch(RPC_URL, {
      method: "POST",
      body: body,
    });
    return (await response.json()).result;
  } catch (error) {
    console.error("Error executing RPC method:", error);
    throw error;
  }
}
async function getEncodedFunctionData(contract, method, params) {
  const functionABI = contract.interface.getFunction(method);

  // Encode the function call data
  const functionData = contract.interface.encodeFunctionData(
    functionABI,
    params
  );

  return functionData;
}
const method = "increment";

// Get chain ID
const chainId = await rpcCall("eth_chainId");
// Get gas price
const gasPrice = await rpcCall("eth_gasPrice");
// Get sender's nonce
const nonce = await rpcCall("eth_getTransactionCount", [
  signer.address,
  "latest",
]);
// Encode Function Data
const encodedFunctionData = await getEncodedFunctionData(target_sc, method, []);
const transactionObject = {
  from: signer.address,
  to: CONTRACT_ADDRESS,
  gasPrice: gasPrice,
  nonce: nonce,
  chainId: chainId,
  data: encodedFunctionData,
};

transactionObject.gasLimit = await rpcCall("eth_estimateGas", [
  transactionObject,
]);
const signedTx = await signer.signTransaction(transactionObject);
// Send raw transactionconst txHash = await rpcCall('eth_sendRawTransaction', [signedTx]);
console.log("Transaction sent. Transaction hash:", txHash);
return Functions.encodeString(txHash);

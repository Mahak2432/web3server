

// import express from 'express';
const express = require('express');
// import Web3 from 'web3';

const app = express();
const cors = require('cors');

require('dotenv').config();

app.use(express.json());
app.use(cors());

// Ethereum setup
const Web3 = require('web3');


const address = [process.env.urlHospiltal1, process.env.urlHospiltal2];






const contractABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "blockID",
				"type": "string"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "patientID",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "referenceLink",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "previousBlockID",
						"type": "string"
					}
				],
				"indexed": false,
				"internalType": "struct PatientReportManager.PatientData[]",
				"name": "patientDataArray",
				"type": "tuple[]"
			}
		],
		"name": "DataStored",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "blockID",
				"type": "string"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "patientID",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "referenceLink",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "previousBlockID",
						"type": "string"
					}
				],
				"internalType": "struct PatientReportManager.PatientData[]",
				"name": "patientDataArray",
				"type": "tuple[]"
			}
		],
		"name": "storeData",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "blockID",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "patientID",
				"type": "string"
			}
		],
		"name": "retrieveData",
		"outputs": [
			{
				"internalType": "string",
				"name": "referenceLink",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "previousBlockID",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];




// API endpoint to handle mempool data and create a transaction
app.post('/submit-mempool', async (req, res) => {
	try {

		var ran=Math.floor(Math.random() * 2);

		const web3 = new Web3(address[ran]);
		const contractAddress = '0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da'; // Replace with your contract's address
		const contract = new web3.eth.Contract(contractABI, contractAddress);

		const mempool = req.body;

		const blockID = mempool.block.blockID;
		console.log(blockID, mempool);
		const PatientDatas = mempool.block.patientDatas; // or any other way you generate/get this ID
		const { aadharNumber1, link1, oldBlockID1, aadharNumber2, link2, oldBlockID2 } = mempool;
		// console.log(blockID, aadharNumber1, link1, oldBlockID1, aadharNumber2, link2, oldBlockID2);
		const account = '0x68ebe696E27601b6c63628bf28C2f6aA74D491B0'; // Replace with the account that will send the transaction
		const privateKey = '148b1823c31e3f06893fc498bbea8ce79e0a98735b74c520ab3a59122114439a'; // Securely manage this private key

		const tx = contract.methods.storeData(blockID, PatientDatas);
		const gas = 30000000;

		const gasPrice = await web3.eth.getGasPrice();
		const increasedGasPrice = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(110)).div(web3.utils.toBN(100)); // Increase gas price by 10%

		const data = tx.encodeABI();
		const nonce = await web3.eth.getTransactionCount(account);

		console.log('Transaction data:', { from: account, gas, gasPrice, data, nonce });



		const signedTx = await web3.eth.accounts.signTransaction({
			to: contract._address,
			data,
			gas,
			increasedGasPrice,
			nonce,
			chainId: 1795295068// Replace with your chain ID
		}, privateKey);

		web3.eth.sendSignedTransaction(signedTx.rawTransaction)
			.on('transactionHash', hash => {
				console.log('Transaction hash:', hash);
			})
			.on('receipt', receipt => {
				console.log('Transaction was mined, receipt:', receipt);
				res.send({ message: "Transaction mined", txid: receipt.transactionHash });
			})
			.on('error', (error) => {
				console.error('Error with transaction:', error);
				res.status(500).send({ error: 'Transaction failed', details: error.message });
			});
	} catch (error) {
		console.error('Server error:', error);
		res.status(500).send({ error: 'Internal Server Error', details: error.message });
	}
});


app.get('/retrieve-data', async (req, res) => {
	try {
		// Extracting blockID from the query parameters
		var ran=Math.floor(Math.random() * address.length);

		const web3 = new Web3(address[ran]);
		const contractAddress = '0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da'; // Replace with your contract's address
		const contract = new web3.eth.Contract(contractABI, contractAddress);

		console.log(req.body);
		console.log(req.body.request);

		const blockID = req.body.request.blockID;
		const patientID = req.body.request.patientID;
		console.log(blockID, patientID);


		if (!blockID) {
			return res.status(400).send({ error: 'blockID is required' });
		}
		if (!patientID) {
			return res.status(400).send({ error: 'patientID is required' });
		}



		// Calling the retrieveData function of the smart contract
		// const response = await contract.methods.retrieveData('block46').call();
		// console.log(contract.methods.retrieveData(blockID).call());
		const responses = [];

		try {
			const response = await contract.methods.retrieveData(blockID, patientID).call();
			// const response = await web3.eth.call({
			// 	to: contractAddress,
			// 	data: callData
			// });
			// console.log('Data retrieved successfully');
			// console.log(typeof (response));
			// responses.push(response.referenceLink);
			// blockID = response.previousHash;

		
			res.send(response);
		} catch (error) {
			console.log('Error while retrieving data:');
			console.log(error);
			res.send(error);
		}

		// response = getValueAtAddress('http://127.0.0.1:8545', contractABI, contractAddress);

		// Optional: Handling the response based on your smart contract logic
		// e.g., checking if the response indicates no data or unauthorized access

		// Sending back the data
	
	} catch (error) {
		console.error('Error in retrieving data:', error);
		res.status(500).send({ error: 'Internal Server Error', details: error.message });
	}
});




const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

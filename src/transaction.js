const CryptoJS = require("crypto-js"),
	elliptic = require("elliptic");

const ec = new EC("secp256k1");

//transaction Output
class TxOut {
	constructor (address, amount){
		this.address = address;
		this.amount = amount;
	}
}

//transaction Input
class TxIn {
	//Unspent Transaction Output(UTO)
	//uTxOutId
	//uTxOutIndex
	//Signature

}


class Transaction {
	//ID
	//txIns[5, 5]
	//txOuts[10]

}

//UTO
class UTxOut {
	constructor(txOutId, txOutIndex, address, amount){
		this.txOutId = txOutId;
		this.txOutIndex = txOutIndex;
		this.address = address;
		this.amount = amount;
	}
}


let uTxOuts = [];

//get Transaction ID
const getTxId = tx => {
	const txInContent = tx.txIns
		.map(txIn = txIn.txOutId + txIn.txOutIndex)
		.reduce((a,b) => a + b, "");


	const txOutContent = tx.txOuts
		.map(txOut => txOut.address + txOut.amount)
		.reduce((a,b) => a + b, "");
		/*
		{address: '48484848', amount:50}
		{address: '48484848', amount:40}
		{address: '48484848', amount:60}

		1)map -> ['4848484850', '4848484840', '4848484860']
		2)reduce -> ['484848485048484848404848484860'] 
		3)return it
		*/
	return CryptoJS.SHA256(txInContent + txOutContent).toString();

};


const findUTxOut = (txOutId, txOutIndex, uTxOutList => {
	return uTxOutList.find(uTxOut => uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex)
}


const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
	const txIn = tx.txIn[txInIndex];
	const dataToSign = tx.id;
	//To Do: Find Tx
	const referencedUTxOut = null;
	if(referencedUTxOut === null) {
		return;
	}
};




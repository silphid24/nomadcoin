const CryptoJS = require("crypto-js"),
	elliptic = require("elliptic");
	utils = require("./utils")
const ec = new elliptic.ec("secp256k1");

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

//among the uTxOuts[] we try to find one of them. cause, we need to proove the money we have.
const findUTxOut = (txOutId, txOutIndex, uTxOutList => {
	return uTxOutList.find(uTxOut => uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex);
}


const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
	const txIn = tx.txIn[txInIndex];
	const dataToSign = tx.id;
	//To Do: Find Tx
	const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOuts);
	if(referencedUTxOut === null) {
		return;
	}
	// To do: Sign the txIn
	const key = ec.keyFromPrivate(privateKey, "hex");
	const signature = utils.toHexString(key.sign(dataToSign).toDER());
	return signature;
};


const updateUTxOuts = (newTxs, uTxOutList) => {
	 //looping into all the transactions
	 const newUTxOuts = newTxs.map(tx => {
	 	//then, looping into all the output.
	 	tx.txOuts.map(
	 		(txOut, index) => {
	 			//UST Output
	 			new UTxOut(tx.id, index, txOut.address, txOut.amount);
	 		});
	 })
	 .reduce((a,b) => a.concat(b), []);

	// All of the spent TxOutput has to be empty. 
	//ex) if i send the 10 coin by using 50. TxOutput 50 should be empty after transaction. 40 and 10 txOutput only left.
	const spentTxOuts = newTxs
		.map(tx => tx.txIns)
		.reduce((a,b) => a.concat(b), []) //At this statment, Full of transaction inputs array.
		.map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, "", 0)); // When the transaction input come in, delete the amount and address which is used here.

	//if the output is used, find it on the unspent list, then remove from the Unspent output list.
	const resultingUTxOuts = uTxOutList
		.filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts)) //remove the spentTxOuts(filtering)
		.concat(newUTxOuts); //and then, concatenate the new unspent outputs.

	return resultingUTxOuts;

};

/*
[A(40), A, B, C, D, E, F, ZZ, MM]

A(40) ---> TRANSACTION ---> ZZ(10)
                       ---> MM(30)
*/

const isTxInStructureValid = (txIn) => {
	if(txIn === null) {
		return false;
	} else if (typeof txIn.signature !== "string") {
		return false;
	} else if (typeof txIn.txOutId !== "string") {
		return false;
	} else if (typeof txIn.txOutIndex !== "number") {
		return false;
	} else {
		return true;
	}
}

const isAddressValid =  (address) => {
	if(address.length !== 130){
		return false;
	} else if (address.match("^[a-fA-F0-9]+$") === null) {
		return false;
	} else if (!address.startsWith("04")){ 
		return false;
	} else {
		return true;
	}
}

const isTxOutStructureValid = (txOut) => {
	if(txout === null){
		return false;
	} else if (typeof txOut.address !== "string"){
		return false;
	} else if (!isAddressValid(txOut.address)) {
		return false;
	} else if (typeof txOut.amount !== "number"){
		return false;
	} else {
		return true;
	}
}

const isTxStructureValid = (tx) => {

	if (typeof tx.id !== "string") {
		console.log("Tx ID is not valid");
		return false;
	//Check the type of tx.txIns as Array	
	} else if(!(tx.txIns instanceof Array)) {
		console.log("The txIns are not an array");
		return false;
	} else if (!tx.txIns.map(isTxInStructureValid).reduce((a,b) => a && b, true)) {
		console.log("The structure of one of the txIn is not vaild");
	} else if (!(tx.txOuts instanceof Array)) {
		console.log("The txOuts are not an array");
		return false;
	} else if (!tx.txOut.map(isTxOutStructureValid).reduce((a,b) => a && b, true)){
		console.log("The structure of one of the txOut is not vaild");
		return false;
	} else {
		return true;
	}
};

//[true, true, false, true, false].reduce()
//true && true so on. basically check the list that all of them are true.


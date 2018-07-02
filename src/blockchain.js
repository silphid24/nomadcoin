const CryptoJS = require("crypto-js");


class Block{
	constructor(index, hash, previousHash, timestamp, data){
		this.index = index;
		this.hash = hash;
		this.previousHash = previousHash;
		this.timestamp = timestamp;
		this.data = data;
	}
}



const genesisBlock = new Block(
	0,
	"AC875B3A03941773BF37AEFB10588817FF90EED5B4855ACFDA3753F1E33915C6",
	null,
	1529047548984,
	"This is the genesis!!"
);

let blockchain = [genesisBlock];

console.log(blockchain);

const getNewestBlock = () => blockchain[blockchain.length - 1];

//Below func is same as const getNewestBlock
/*
function getNewestBlock(){
	return blockchain[blockchain.length - 1];
}
*/



const getTimestamp = () => new Date().getTime() / 1000;

const getBlockchain = () => blockchain;


const createHash = (index, previousHash, timestamp, data) => 
	CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();

//const testA = CryptoJS.SHA256(1).toString;
//console.log("testA: ",testA);


//const testHash = [createHash(1,2,3,"korea")];
//console.log(testHash);

const createNewBlock = data => {
	const previousBlock = getNewestBlock();
	const newBlockIndex = previousBlock.index + 1;
	const newTimestamp = getTimestamp();

	//create newHash with blockHeader's data
	const newHash = createHash(
		newBlockIndex, 
		previousBlock.hash, 
		newTimestamp, 
		data
	);

	//if newHash data changed, this block is invalid.
	const newBlock = new Block(
		newBlockIndex,
		newHash,
		previousBlock.hash,
		newTimestamp,
		data

	);
	addBlockToChain(newBlock);
	return newBlock;
};

//const testBlock = createNewBlock();
//console.log(testBlock);

//
const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);


const isBlockValid = (candidateBlock, latestBlock) => {
	if (!isBlockStructureValid(candidateBlock)){
		console.log("This candidate block structure is not vaild");
		return false;
	}
	else if (latestBlock.index + 1 !== candidateBlock.index){
		console.log("The candidate block doesnt have a valid index");
		return false;

	} else if (latestBlock.hash !== candidateBlock.previousHash) {
		console.log(
			"The previousHash of the candidate block is not the hash of the latest block"
		);
		return false;

	} else if (getBlocksHash(candidateBlock) !== candidateBlock.hash){
		console.log("The hash of this block is invalid");
		return false;
	}
	return true;
};


const isBlockStructureValid = (block) => {
	return (
		typeof block.index === "number" &&
		typeof block.hash === "string" &&
		typeof block.previousHash === "string" &&
		typeof block.timestamp === "number" &&
		typeof block.data === "string" 
	);
};



const isChainValid = candidateChain => {
	const isGenesisValid = block => {
		return JSON.stringify(block) === JSON.stringify(genesisBlock);

	};
	if (!isGenesisValid(candidateChain[0])) {
		console.log("The candidateChain's genesisBlock is not the same as genesisBlock");
		return false;

	}


	// without Genesisblock(it doenst has a previousHash), checking all the blocks's Hashcheck for validating.
	for (let i = 1; candidateChain.length; i++){

		if (isBlockValid(candidateChain[i], candidateChain[i - 1])) {
			return false;
		}


	}
	return true;
};

const replaceChain = candidateChain => {
	if(isChainValid(candidateChain) && candidateChain.length > getBlockchain().length) {
		blockchain = candidateChain;
		return true;
	} else {
		return false;
	}
};


const addBlockToChain = candidateBlock => {
	if(isBlockValid(candidateBlock, getNewestBlock())) {
		blockchain.push(candidateBlock);
		return true;
	} else {
		return false;
	}
}


module.exports = {
	getBlockchain,
	createNewBlock,
	getNewestBlock,
	isBlockStructureValid,
	addBlockToChain,
	replaceChain
};



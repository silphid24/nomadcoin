const CryptoJS = require("crypto-js"),
	hexToBinary = require("hex-to-binary");

const BLOCK_GENERATION_INTERVAL = 10;
//In bitcoin case, it is 2016
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Block{
	constructor(index, hash, previousHash, timestamp, data, difficulty, nonce){
		this.index = index;
		this.hash = hash;
		this.previousHash = previousHash;
		this.timestamp = timestamp;
		this.data = data;
		this.difficulty = difficulty;
		this.nonce = nonce;
	}
}


const genesisBlock = new Block(
	0,
	"AC875B3A03941773BF37AEFB10588817FF90EED5B4855ACFDA3753F1E33915C6",
	null,
	1530698609,
	"This is the genesis!!",
	0,
	0
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


//Math.round - up
const getTimestamp = () => Math.round(new Date().getTime() / 1000);

const getBlockchain = () => blockchain;


const createHash = (index, previousHash, timestamp, data, difficulty, nonce) => 
	CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce).toString();

//const testA = CryptoJS.SHA256(1).toString;
//console.log("testA: ",testA);


//const testHash = [createHash(1,2,3,"korea")];
//console.log(testHash);

const createNewBlock = data => {
	const previousBlock = getNewestBlock();
	const newBlockIndex = previousBlock.index + 1;
	const newTimestamp = getTimestamp();
	const difficulty = findDifficulty();
	
	/*
	//create newHash with blockHeader's data
	const newHash = createHash(
		newBlockIndex, 
		previousBlock.hash, 
		newTimestamp, 
		data
	);*/

	//if newHash data changed, this block is invalid.
	const newBlock = findBlock(
		newBlockIndex,
		previousBlock.hash,
		newTimestamp,
		data,
		//test difficulty as 20
		//20
		difficulty
	);

	addBlockToChain(newBlock);
	require("./p2p").broadcastNewBlock();
	return newBlock;
};


const findDifficulty = () => {
	const newestBlock = getNewestBlock();
	if(newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && newestBlock.index !== 0) {
		//calculate new difficulty
		return calculateNewDifficulty(newestBlock, getBlockchain());
	} else {
		return newestBlock.difficulty;
	}
};

const calculateNewDifficulty = (newestBlock, blockchain) => {

	// This case, 10 Blocks(DIFFICULTY_ADJUSTMENT_INTERVAL) before the newestBlock.
	const lastCalculatedBlock = blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
	//timeExpected for block create
	const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
	//Actual timeTaken for block create. 
	const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;

	//if timeTaken less than timeExpected/2
	if(timeTaken < timeExpected/2) {
		//increase difficulty
		return lastCalculatedBlock.difficulty + 1;

	} else if (timeTaken > timeExpected * 2) {
		//if it's hard to create block decrease difficulty
		return lastCalculatedBlock.difficulty - 1;
		//just keep the difficulty
	} else {
		return lastCalculatedBlock.difficulty;
	}
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
	let nonce = 0;


	while (true) {
		console.log("Current nonce: ", nonce);
		const hash = createHash(
			index,
			previousHash,
			timestamp,
			data,
			difficulty,
			nonce
		);
		//to do: check amount of the zeros (hashMatchesDifficulty)
		if(hashMatchesDifficulty(hash, difficulty)){
			return new Block(
				index, 
				hash, 
				previousHash, 
				timestamp, 
				data, 
				difficulty, 
				nonce
			);

		} else {
			nonce++;
		}
	}
};

const hashMatchesDifficulty = (hash, difficulty) => {
	const hashInBinary = hexToBinary(hash);
	const requiredZeros = "0".repeat(difficulty);
	console.log("Trying difficulty:", difficulty, "with hash", hashInBinary);
	//startsWith return true when the () is same with first one.
	return hashInBinary.startsWith(requiredZeros);
}

//const testBlock = createNewBlock();
//console.log(testBlock);

//
const getBlocksHash = (block) => createHash(
	block.index,
	block.previousHash, 
	block.timestamp, 
	block.data,
	block.difficulty,
	block.nonce
);


//Blockchain manipulate difficulty using timestamp. So, need to Valid it 
const isTimeStampValid = (newBlock, oldBlock) => {
	return (
		//Check the oldBlock is less than 
		oldBlock.timestamp - 60 < newBlock.timestamp && 
		//Check the newblock.timestamp is less than realtime(computer time)
		newBlock.timestamp - 60 < getTimestamp()
	);
};

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
	} else if (!isTimeStampValid(candidateBlock, latestBlock)) {
		console.log("The timestamp of this block is dodgy");
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


//To distinguish the chain which is more difficult than itself
const sumDifficulty = anyBlockchain => 

//anyBlockchain's inside we brought block.difficulty
	anyBlockchain
		//array of the difficulty
		.map(block => block.difficulty
		//another array of the difficulty^2 -> [4**2,3**2,5**2~~]
		.map(difficulty => Math.pow(2, difficulty))
		//sum all the value of list and then put it into stack.
		// [1,2,3,4] -> 1+2 ->3+2 ->5+3~~ 
		.reduce((a, b) => a + b));


const replaceChain = candidateChain => {
	//if(isChainValid(candidateChain) && candidateChain.length > getBlockchain().length) {
		//candidate blockchain's difficulty is higher than now then replace blockchain
	if(isChainValid(candidateChain) && sumDifficulty(candidateChain) > sumDifficulty(getBlockchain())) {
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



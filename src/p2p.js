const WebSockets = require("ws"),
	Blockchain = require("./blockchain");


//3 thing we can do,
//1. request latest block
//2. we can requst all the blockchain to replace all the blocks(when it became behind)
//3. we need to recieve the block
const { getNewestBlock, isBlockStructureValid, replaceChain, getBlockchain } = Blockchain;


const sockets = [];

//Messages Types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

//Messages Creators
const getLatest = () => {
	return {
		type: GET_LATEST,
		data: null
	};
};

const getAll = () => {
	return {
		type: GET_ALL,
		data: null
	};
};

const blockchainResponse = data => {
	return {
		type: BLOCKCHAIN_RESPONSE,
		data
	};
};

//send a Message 
const sendMessage = (ws, message) => ws.send(JSON.stringify(message));


const sendMessageToAll = message => sockets.forEach(ws => sendMessage(ws, message));

const getSockets = () => sockets;


//This function has a argument which include express http server
const startP2PServer = server => {
	const wsServer = new WebSockets.Server({ server });
	wsServer.on("connection", ws => {
		console.log(`Hello Socket! ${ws}`);
		initSocketConnection(ws);
	});
	console.log("Nomadcoin P2P Server Running!");
};

// add socket here.
const initSocketConnection = ws => {
	sockets.push(ws);
	handleScoketMessages(ws);
	handleSocketError(ws);
	sendMessage(ws, getLatest());

	//Sending a message (both of them)when the connection is done.
	/*
	ws.on("message", (data) => {
		console.log(data);
	});
	*/
	/* test to sending a message "welcome" to each others.
	setTimeout(() => { 
		ws.send("welcome")
	}, 5000);
	*/

};

//ex. blockchain -> 2peer -> both of them request their latest blocks
// peerA (3blocks) , peerB(2blocks) -> they are checking the other's block and know how many block they have.
// if differencie is only one or two, they will bring latest block. but, if it's like 3 or 10 then they will replace whole peer.




//try-catch block(error catch)
const parseData = data => {
	try {
		return JSON.parse(data);
	} catch(e) {
		console.log(e);
		return null;
	} 
};

const handleScoketMessages = ws => {
	ws.on("message", data => {
		const message = parseData(data);

		//if error occured
		if(message === null){
			return;
		}
		console.log(message);

		//3 type of message 

		switch (message.type) {
			case GET_LATEST:
				sendMessage(ws, responseLatest());
				break;

			case GET_ALL:
				sendMessage(ws, responseAll());
				break;				

			case BLOCKCHAIN_RESPONSE:
				const receivedBlocks = message.data;
				if (receivedBlocks === null){
					break;
				}
				handleBlockchainResponse(receivedBlocks);
				break;
		}
	});
};

const handleBlockchainResponse = receivedBlocks => {

	if (receivedBlocks.length === 0) {
		console.log("Received blocks have a length of 0");
		return;
	}

	// it will return receivedBlocks, Depends on the number of array.
	const latestBlockReceived = receivedBlocks[receivedBlocks.length -1];
	if (!isBlockStructureValid(latestBlockReceived)){
		console.log("The block structure of the block received is not valid");
		return;
	}

	const newestBlock = getNewestBlock();

	//somebody's ahaed of this block.
	if (latestBlockReceived.index > newestBlock.index){

		//this case, one block ahead, so add block
		if (newestBlock.hash === latestBlockReceived.previousHash){
			addBlockToChain(latestBlockReceived);

		}
		//if we only got 1 block, and it's way behind, then replace the all block
		//need more understanding.
		else if (receivedBlocks.length === 1){
			//to do, get all the blocks, cause we are waaay behind
			sendMessageToAll(getAll());
		}
		//otherwise, replace, chain.
		else{
			replaceChain(receivedBlocks);
		}
	}
};


const responseLatest = () => blockchainResponse([getNewestBlock()]);


const responseAll = () => blockchainResponse(getBlockchain());


const handleSocketError = ws => {
	//Declare this func
	const closeSocketConnection = ws => {
		ws.close();
		//To prevent the error, Declaration to remove socket in sockets array.
		sockets.splice(sockets.indexOf(ws), 1);
	}
	//call to remove sockets arrary when it close or error occured.
	ws.on("close", () => closeSocketConnection(ws));
	ws.on("error", () => closeSocketConnection(ws));
}



//take new peer url from webSockets. 
const connectToPeers = newPeer => {
	//make new sockets
	const ws = new WebSockets(newPeer);

	// when new sockets open, make socket connection(push the socket to the sockets array. 
	ws.on("open", () => {
		initSocketConnection(ws);
	});
};

module.exports = {
	startP2PServer,
	connectToPeers
};
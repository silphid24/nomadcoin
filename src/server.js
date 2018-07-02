const express = require("express"),
	bodyParser = require("body-parser"),
	morgan = require("morgan"),
	Blockchain = require("./blockchain");
	P2P = require("./p2p");

	const { getBlockchain, createNewBlock } = Blockchain;
	const { startP2PServer, connectToPeers } = P2P;

	//Pssst. Don't forget about typing 'export HTTP_PORT=4000' in your console
	const PORT = process.env.HTTP_PORT || 3000;

	const app = express();

	app.use(bodyParser.json());
	app.use(morgan("combined"));


	app.get("/blocks", (req, res) => {
		res.send(getBlockchain());
	});

	app.post("/blocks", (req, res) => {
		const { body: { data } } = req;
		const newBlock = createNewBlock(data);
		res.send(newBlock);
	});


	//make one more router
	app.post("/peers", (req, res) => {
		//insde of the body, take the peer and it's inside of the req.
		const { body : { peer } } = req;
		connectToPeers(peer);
		//kill the connection.
		res.send();
	})

	const server = app.listen(PORT, () => console.log("Nomadcoin HTTP Server running on port", PORT));

	startP2PServer(server);
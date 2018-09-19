const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const players = {};
let unmatched;

server.listen(process.env.PORT || 3000);

function joinGame(socket) {
	players[socket.id] = {
		opponent: unmatched,
		playerSymbol: 'X',
		socket
	};

	if (unmatched) {
		players[socket.id].playerSymbol = 'O';
		players[unmatched].opponent = socket.id;
		unmatched = null;
	} else {
		unmatched = socket.id;
	}
}

function getOpponent(socket) {
	if (!players[socket.id].opponent) {
		return;
	}

	return players[players[socket.id].opponent].socket;
}

io.on('connection', socket => {
	joinGame(socket);

	if (getOpponent(socket)) {
		socket.emit('game.begin', {
			playerSymbol: players[socket.id].playerSymbol
		});

		getOpponent(socket).emit('game.begin', {
			playerSymbol: players[getOpponent(socket).id].playerSymbol
		});
	}

	socket.on('make.move', data => {
		if (!getOpponent(socket)) {
			return;
		}

		socket.emit('move.made', data);
		getOpponent(socket).emit('move.made', data);
	});

	socket.on('disconnect', () => {
		if (getOpponent(socket)) {
			getOpponent(socket).emit('opponent.left');
		}
	});
});

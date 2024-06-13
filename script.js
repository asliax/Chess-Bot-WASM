document.addEventListener('DOMContentLoaded', () => {
    const bodyElement = document.body;
    const wrapperElement = document.getElementById('wrapper');
    const restartButton = document.getElementById('restartButton');
    const boardConfig = {
        draggable: true,
        position: 'start',
        orientation: 'white',
        onDrop: handleMove,
    };

    const game = new Chess();
    const board = Chessboard('board', boardConfig);

    // Initialize Stockfish WASM using the local path
    const stockfish = new Worker('js/stockfish.js');

    stockfish.onmessage = function(event) {
        const message = event.data;
        console.log('Stockfish: ' + message);
        if (message.startsWith('bestmove')) {
            const bestMove = message.split(' ')[1];
            game.move({ from: bestMove.slice(0, 2), to: bestMove.slice(2, 4), promotion: 'q' });
            board.position(game.fen());
            if (game.game_over()) {
                console.log('Game over');
                displayRestartButton();
            }
        }
    };

    function handleMove(source, target) {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q' // promote to a queen if applicable
        });

        if (move === null) return 'snapback';

        if (game.game_over()) {
            console.log('Game over');
            displayRestartButton();
        } else {
            window.setTimeout(makeBestMove, 250);
        }
    }

    function makeBestMove() {
        const fen = game.fen();
        stockfish.postMessage(`position fen ${fen}`);
        stockfish.postMessage('go depth 15');
    }

    function displayRestartButton() {
        console.log('Displaying restart button');
        restartButton.style.display = 'block';
    }

    restartButton.addEventListener('click', () => {
        console.log('Restarting game');
        game.reset();
        board.start();
        restartButton.style.display = 'none';
    });

    // Stockfish makes the first move if the opponent is black
    if (game.turn() === 'b') {
        window.setTimeout(makeBestMove, 250);
    }
});

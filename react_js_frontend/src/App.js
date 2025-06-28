import React, { useState, useEffect } from "react";
import "./App.css";

// NES pixel font via Google Fonts CDN
const PRESS_START_2P_FONT = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

// NES-style color palette
const NES_COLORS = {
  primary: "#9f1e69",
  secondary: "#424242",
  accent: "#ff9800",
  light: "#fffbea",
  dark: "#232323",
  white: "#fff",
  border: "#161018",
  winBar: "#b7f862"
};

// Pixel X SVG
function XIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
      <rect x="6" y="16" width="28" height="8" transform="rotate(45 20 20)" rx="2" fill={NES_COLORS.primary} />
      <rect x="6" y="16" width="28" height="8" transform="rotate(-45 20 20)" rx="2" fill={NES_COLORS.primary} />
      <rect x="11" y="19" width="18" height="2" fill={NES_COLORS.accent} transform="rotate(45 20 20)" />
      <rect x="11" y="19" width="18" height="2" fill={NES_COLORS.accent} transform="rotate(-45 20 20)" />
    </svg>
  );
}

// Pixel O SVG
function OIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
      <ellipse cx="20" cy="20" rx="14" ry="14" fill={NES_COLORS.light} stroke={NES_COLORS.primary} strokeWidth="6" />
      <ellipse cx="20" cy="20" rx="8" ry="8" fill={NES_COLORS.white} stroke={NES_COLORS.accent} strokeWidth="2" />
    </svg>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Load pixel font
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = PRESS_START_2P_FONT;
    document.head.appendChild(link);
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const initialBoard = Array(9).fill(null);

  // Game state
  const [mode, setMode] = useState("pvp"); // "pvp" or "ai"
  const [board, setBoard] = useState(initialBoard);
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [status, setStatus] = useState("playing"); // "playing", "won", "draw"
  const [winnerLine, setWinnerLine] = useState([]);
  const [winningPlayer, setWinningPlayer] = useState(null);

  // Start/restart the game
  // PUBLIC_INTERFACE
  function handleRestart() {
    setBoard(initialBoard);
    setXIsNext(true);
    setStatus("playing");
    setWinnerLine([]);
    setWinningPlayer(null);
    setHistory([]);
  }

  // PUBLIC_INTERFACE
  function handleResetScores() {
    setScores({ X: 0, O: 0 });
    handleRestart();
  }

  // Returns 'X', 'O', or null
  function calculateWinner(b) {
    const lines = [
      [0, 1, 2], // rows
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6], // columns
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8], // diagonals
      [2, 4, 6]
    ];
    for (let [a, s, d] of lines) {
      if (b[a] && b[a] === b[s] && b[a] === b[d]) {
        return [b[a], [a, s, d]];
      }
    }
    return [null, []];
  }

  // AI Player - Basic (random empty square)
  function aiChooseMove(b) {
    const available = b
      .map((sq, idx) => (sq === null ? idx : null))
      .filter(idx => idx !== null);
    if (available.length === 0) return null;
    // Try to win or block, else random
    // 1. Check for win
    for (let idx of available) {
      const copy = [...b];
      copy[idx] = "O";
      if (calculateWinner(copy)[0] === "O") return idx;
    }
    // 2. Check for block
    for (let idx of available) {
      const copy = [...b];
      copy[idx] = "X";
      if (calculateWinner(copy)[0] === "X") return idx;
    }
    // 3. Center if possible
    if (available.includes(4)) return 4;
    // 4. Random
    return available[Math.floor(Math.random() * available.length)];
  }

  // PUBLIC_INTERFACE
  function handleSquareClick(idx) {
    if (board[idx] || status !== "playing") return;
    const turn = xIsNext ? "X" : "O";
    const b = [...board];
    b[idx] = turn;
    setBoard(b);
    setHistory([...history, board]);

    // Check for win/draw
    const [winner, line] = calculateWinner(b);
    if (winner) {
      setStatus("won");
      setWinnerLine(line);
      setWinningPlayer(winner);
      setScores(scores => ({
        ...scores,
        [winner]: scores[winner] + 1
      }));
      return;
    }
    if (b.every(sq => sq != null)) {
      setStatus("draw");
      setWinnerLine([]);
      setWinningPlayer(null);
      return;
    }
    setXIsNext(!xIsNext);
  }

  // Handle AI Move
  useEffect(() => {
    if (mode === "ai" && !xIsNext && status === "playing") {
      const move = aiChooseMove(board);
      if (move != null) {
        setTimeout(() => {
          handleSquareClick(move);
        }, 700); // Add slight delay for retro effect
      }
    }
    // eslint-disable-next-line
  }, [xIsNext, mode, status, board]);

  // Keyboard controls: arrow keys move focus, Enter selects
  useEffect(() => {
    function onKeyDown(e) {
      if (status !== "playing") return;
      const focus = document.activeElement;
      const activeCell = focus && focus.getAttribute("data-cell-idx");
      let idx = activeCell ? parseInt(activeCell, 10) : 0;
      let nextIdx = idx;
      if (["ArrowRight", "d"].includes(e.key)) nextIdx = (idx + 1) % 9;
      else if (["ArrowLeft", "a"].includes(e.key)) nextIdx = (idx + 8) % 9;
      else if (["ArrowDown", "s"].includes(e.key)) nextIdx = (idx + 3) % 9;
      else if (["ArrowUp", "w"].includes(e.key)) nextIdx = (idx + 6) % 9;
      else if (["Enter", " "].includes(e.key)) {
        if (!board[idx]) handleSquareClick(idx);
        return;
      } else return;
      e.preventDefault();
      const target = document.querySelector(`[data-cell-idx="${nextIdx}"]`);
      if (target) target.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line
  }, [board, status]);

  // Render helpers
  function renderSquare(idx) {
    const highlight = winnerLine.includes(idx) && status === "won";
    return (
      <button
        className={`ttt-cell${highlight ? " win" : ""}`}
        key={idx}
        onClick={() => handleSquareClick(idx)}
        tabIndex={0}
        data-cell-idx={idx}
        aria-label={`Tic Tac Toe cell ${idx + 1}, currently ${
          board[idx] ? board[idx] : "empty"
        }`}
        disabled={!!board[idx] || status !== "playing"}
      >
        {board[idx] === "X" ? <XIcon /> : board[idx] === "O" ? <OIcon /> : null}
      </button>
    );
  }

  function getStatusText() {
    if (status === "won")
      return `Winner: ${winningPlayer === "X" ? "Player 1 [X]" : mode === "ai" ? "NES" : "Player 2 [O]"}`;
    if (status === "draw") return "Draw Game!";
    if (mode === "ai")
      return xIsNext ? "Player 1 [X]: Your Move" : "NES [O]: Thinking...";
    return xIsNext ? "Player 1 [X]: Your Move" : "Player 2 [O]: Your Move";
  }

  // PUBLIC_INTERFACE
  function handleModeChange(evt) {
    setMode(evt.target.value);
    handleRestart();
  }

  // UI
  return (
    <div className="nes-root">
      <div className="ttt-main-panel">
        <h1 className="ttt-title" tabIndex={-1}>
          TIC TAC TOE
        </h1>
        <div className="score-panel">
          <span>
            <span style={{ color: NES_COLORS.primary }}>X</span>: {scores.X}
          </span>
          <span className="bar">|</span>
          <span>
            <span style={{ color: NES_COLORS.accent }}>O</span>: {scores.O}
          </span>
        </div>
        <div className="mode-panel">
          <label>
            <input
              type="radio"
              name="mode"
              value="pvp"
              checked={mode === "pvp"}
              onChange={handleModeChange}
            />
            <span>2 PLAYERS</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="ai"
              checked={mode === "ai"}
              onChange={handleModeChange}
            />
            <span>VS NES</span>
          </label>
        </div>
        <div className="status-panel">
          <span>{getStatusText()}</span>
        </div>
        <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
          {Array(3)
            .fill(0)
            .map((_, rowIdx) => (
              <div className="ttt-row" key={rowIdx} role="row">
                {Array(3)
                  .fill(0)
                  .map((_, colIdx) =>
                    renderSquare(rowIdx * 3 + colIdx)
                  )}
              </div>
            ))}
        </div>
        <div className="retro-btn-panel">
          <button className="retro-btn" onClick={handleRestart}>
            Restart
          </button>
          <button className="retro-btn" onClick={handleResetScores}>
            Reset Scores
          </button>
        </div>
        <footer className="ttt-footer">
          <p>
            <span role="img" aria-label="joystick">🕹️</span>
            <span className="footer-text">
              Retro mode. <span style={{ color: NES_COLORS.accent }}>NES UI</span> built with React.
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

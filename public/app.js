const COLUMNS = "ABCDEFGHJKLMNOPQRST".split("");
const EMPTY = null;
const BLACK = "B";
const WHITE = "W";

const state = {
  size: 19,
  board: [],
  moves: [],
  captures: { B: 0, W: 0 },
  mode: "game",
  activeTab: "ascii"
};

const els = {
  board: document.querySelector("#board"),
  boardSize: document.querySelector("#boardSize"),
  colorLabel: document.querySelector("#colorLabel"),
  nextColor: document.querySelector("#nextColor"),
  autoAlternate: document.querySelector("#autoAlternate"),
  passMove: document.querySelector("#passMove"),
  undoMove: document.querySelector("#undoMove"),
  clearBoard: document.querySelector("#clearBoard"),
  sampleGame: document.querySelector("#sampleGame"),
  importText: document.querySelector("#importText"),
  importMoves: document.querySelector("#importMoves"),
  statusLine: document.querySelector("#statusLine"),
  outputText: document.querySelector("#outputText"),
  copyAscii: document.querySelector("#copyAscii"),
  copyMoves: document.querySelector("#copyMoves"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  tabs: Array.from(document.querySelectorAll(".tab"))
};

function makeBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(EMPTY));
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function otherColor(color) {
  return color === BLACK ? WHITE : BLACK;
}

function colLabel(x) {
  return COLUMNS[x] || "?";
}

function pointName(x, y, size = state.size) {
  return `${colLabel(x)}${size - y}`;
}

function parsePointName(value, size = state.size) {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^([A-HJ-T])\s*(\d{1,2})$/);
  if (!match) return null;

  const x = COLUMNS.indexOf(match[1]);
  const rowNumber = Number(match[2]);
  const y = size - rowNumber;

  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return { x, y };
}

function sgfCoordToPoint(coord, size = state.size) {
  if (!coord) return null;
  const x = coord.charCodeAt(0) - 97;
  const y = coord.charCodeAt(1) - 97;

  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return { x, y };
}

function pointToSgfCoord(point) {
  if (!point) return "";
  return `${String.fromCharCode(97 + point.x)}${String.fromCharCode(97 + point.y)}`;
}

function neighbors(point, size = state.size) {
  return [
    { x: point.x - 1, y: point.y },
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y - 1 },
    { x: point.x, y: point.y + 1 }
  ].filter((candidate) => (
    candidate.x >= 0 && candidate.x < size && candidate.y >= 0 && candidate.y < size
  ));
}

function collectGroup(board, start) {
  const color = board[start.y][start.x];
  const stack = [start];
  const seen = new Set();
  const stones = [];
  let liberties = 0;

  while (stack.length) {
    const current = stack.pop();
    const key = `${current.x},${current.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stones.push(current);

    for (const next of neighbors(current, board.length)) {
      const value = board[next.y][next.x];
      if (value === EMPTY) {
        liberties += 1;
      } else if (value === color) {
        stack.push(next);
      }
    }
  }

  return { stones, liberties };
}

function placeStone(color, point, options = {}) {
  const board = options.board || cloneBoard(state.board);

  if (board[point.y][point.x] !== EMPTY) {
    return { ok: false, reason: "Ese punto ya esta ocupado." };
  }

  board[point.y][point.x] = color;
  const captured = [];

  for (const next of neighbors(point, board.length)) {
    if (board[next.y][next.x] !== otherColor(color)) continue;
    const group = collectGroup(board, next);
    if (group.liberties === 0) {
      for (const stone of group.stones) {
        board[stone.y][stone.x] = EMPTY;
        captured.push(stone);
      }
    }
  }

  const ownGroup = collectGroup(board, point);
  if (ownGroup.liberties === 0) {
    return { ok: false, reason: "La jugada seria suicidio." };
  }

  return { ok: true, board, captured };
}

function rebuildFromMoves(moves) {
  const board = makeBoard(state.size);
  const captures = { B: 0, W: 0 };
  const accepted = [];

  for (const move of moves) {
    if (move.pass) {
      accepted.push({ ...move, boardAfter: cloneBoard(board) });
      continue;
    }

    const result = placeStone(move.color, move.point, { board });
    if (!result.ok) {
      return { ok: false, reason: `Jugada ${accepted.length + 1}: ${result.reason}` };
    }

    captures[move.color] += result.captured.length;
    accepted.push({ ...move, captured: result.captured, boardAfter: cloneBoard(board) });
  }

  state.board = board;
  state.captures = captures;
  state.moves = accepted;
  return { ok: true };
}

function playMove(color, point) {
  const candidateMoves = state.moves.map(({ color: moveColor, point: movePoint, pass }) => ({
    color: moveColor,
    point: movePoint,
    pass
  }));
  candidateMoves.push({ color, point, pass: false });

  const result = rebuildFromMoves(candidateMoves);
  if (!result.ok) {
    setStatus(result.reason);
    return;
  }

  if (els.autoAlternate.checked) {
    els.nextColor.value = otherColor(color);
  }
  setStatus(`Jugada ${state.moves.length}: ${color} ${pointName(point.x, point.y)}`);
  render();
}

function editPoint(point) {
  const currentValue = state.board[point.y][point.x];

  if (state.mode === "draw") {
    if (currentValue === EMPTY) {
      const color = els.nextColor.value;
      state.board[point.y][point.x] = color;
      state.captures = { B: 0, W: 0 };
      setStatus(`Pintada ${color} ${pointName(point.x, point.y)}.`);
    } else {
      state.board[point.y][point.x] = EMPTY;
      state.captures = { B: 0, W: 0 };
      setStatus(`Retirada ${currentValue} ${pointName(point.x, point.y)}.`);
    }
    render();
    return;
  }

  if (currentValue !== EMPTY) {
    setStatus("Ese punto ya esta ocupado.");
    return;
  }

  playMove(els.nextColor.value, point);
}

function passMove() {
  const color = els.nextColor.value;
  const candidateMoves = state.moves.map(({ color: moveColor, point, pass }) => ({
    color: moveColor,
    point,
    pass
  }));
  candidateMoves.push({ color, point: null, pass: true });
  rebuildFromMoves(candidateMoves);

  if (els.autoAlternate.checked) {
    els.nextColor.value = otherColor(color);
  }
  setStatus(`Jugada ${state.moves.length}: ${color} pasa`);
  render();
}

function undoMove() {
  if (!state.moves.length) return;
  const candidateMoves = state.moves.slice(0, -1).map(({ color, point, pass }) => ({
    color,
    point,
    pass
  }));
  rebuildFromMoves(candidateMoves);
  setStatus("Ultima jugada deshecha.");
  render();
}

function resetBoard(size = state.size) {
  state.size = size;
  state.board = makeBoard(size);
  state.moves = [];
  state.captures = { B: 0, W: 0 };
  els.nextColor.value = BLACK;
  setStatus("");
  render();
}

function starPoints(size) {
  if (size === 19) return [3, 9, 15].flatMap((x) => [3, 9, 15].map((y) => `${x},${y}`));
  if (size === 13) return [3, 6, 9].flatMap((x) => [3, 6, 9].map((y) => `${x},${y}`));
  if (size === 9) return [2, 4, 6].flatMap((x) => [2, 4, 6].map((y) => `${x},${y}`));
  return [];
}

function renderBoard() {
  const stars = new Set(starPoints(state.size));
  const boardEdge = 6;
  const boardSpan = 100 - (boardEdge * 2);
  const pointStep = boardSpan / (state.size - 1);

  els.board.style.setProperty("--board-size", state.size);
  els.board.style.setProperty("--grid-lines", state.size - 1);
  els.board.style.setProperty("--board-edge", `${boardEdge}%`);
  els.board.style.setProperty("--stone-size", `${pointStep * 0.88}%`);
  els.board.replaceChildren();

  for (let y = 0; y < state.size; y += 1) {
    for (let x = 0; x < state.size; x += 1) {
      const value = state.board[y][x];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "point";
      button.dataset.x = String(x);
      button.dataset.y = String(y);
      button.style.left = `${boardEdge + (x * pointStep)}%`;
      button.style.top = `${boardEdge + (y * pointStep)}%`;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `${pointName(x, y)} ${value || "vacio"}`);

      if (value === BLACK) button.classList.add("black");
      if (value === WHITE) button.classList.add("white");
      if (stars.has(`${x},${y}`)) button.classList.add("star");

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        editPoint({ x, y });
      });
      button.addEventListener("click", (event) => {
        if (event.detail === 0) {
          editPoint({ x, y });
        }
      });
      els.board.append(button);
    }
  }
}

function moveText(move, index) {
  const played = move.pass ? "pass" : pointName(move.point.x, move.point.y);
  const captureText = move.captured && move.captured.length ? ` captura ${move.captured.length}` : "";
  return `${index + 1}. ${move.color} ${played}${captureText}`;
}

function asciiBoard() {
  const labels = COLUMNS.slice(0, state.size).join(" ");
  const rows = [];

  rows.push(`Size: ${state.size}x${state.size}`);
  rows.push(`Mode: ${state.mode === "draw" ? "Board drawing" : "Game"}`);
  rows.push("Legend: X=Black, O=White, .=Empty");
  if (state.mode === "game") {
    rows.push(`Captures by Black: ${state.captures.B}; Captures by White: ${state.captures.W}`);
    rows.push(`Next to play: ${els.nextColor.value === BLACK ? "Black" : "White"}`);
  } else {
    rows.push(`Selected stone: ${els.nextColor.value === BLACK ? "Black" : "White"}`);
  }
  rows.push("");
  rows.push(`    ${labels}`);

  for (let y = 0; y < state.size; y += 1) {
    const rowNumber = String(state.size - y).padStart(2, " ");
    const values = state.board[y].map((value) => {
      if (value === BLACK) return "X";
      if (value === WHITE) return "O";
      return ".";
    }).join(" ");
    rows.push(`${rowNumber}  ${values}  ${rowNumber}`);
  }

  rows.push(`    ${labels}`);
  return rows.join("\n");
}

function movesList() {
  if (state.mode === "draw") return "Modo dibujar tablero: sin lista de jugadas.";
  if (!state.moves.length) return "Sin jugadas registradas.";
  return state.moves.map(moveText).join("\n");
}

function setupSgfText() {
  const black = [];
  const white = [];

  for (let y = 0; y < state.size; y += 1) {
    for (let x = 0; x < state.size; x += 1) {
      const value = state.board[y][x];
      if (value === BLACK) black.push(`[${pointToSgfCoord({ x, y })}]`);
      if (value === WHITE) white.push(`[${pointToSgfCoord({ x, y })}]`);
    }
  }

  return `(;GM[1]FF[4]SZ[${state.size}]${black.length ? `AB${black.join("")}` : ""}${white.length ? `AW${white.join("")}` : ""})`;
}

function sgfText() {
  if (state.mode === "draw") return setupSgfText();
  const body = state.moves.map((move) => `;${move.color}[${pointToSgfCoord(move.point)}]`).join("");
  return `(;GM[1]FF[4]SZ[${state.size}]${body})`;
}

function promptText() {
  return [
    "Analiza esta posicion de Go. Usa coordenadas occidentales (columnas A-T sin I, filas desde el lado de negras).",
    "",
    asciiBoard(),
    "",
    "Move list:",
    movesList(),
    "",
    "SGF:",
    sgfText()
  ].join("\n");
}

function currentOutput() {
  if (state.activeTab === "moves") return `${movesList()}\n\nSGF:\n${sgfText()}`;
  if (state.activeTab === "prompt") return promptText();
  return asciiBoard();
}

function renderOutput() {
  els.outputText.value = currentOutput();
  els.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === state.activeTab);
  });
}

function renderControls() {
  const isDrawMode = state.mode === "draw";

  els.colorLabel.textContent = isDrawMode ? "Piedra" : "Turno";
  els.autoAlternate.disabled = isDrawMode;
  els.passMove.disabled = isDrawMode;
  els.undoMove.disabled = isDrawMode;
  els.copyMoves.textContent = isDrawMode ? "Copiar SGF" : "Copiar jugadas";
  els.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });
}

function render() {
  renderControls();
  renderBoard();
  renderOutput();
}

function setStatus(message) {
  els.statusLine.textContent = message;
}

function parseSgf(input) {
  const sizeMatch = input.match(/SZ\[(\d+)\]/i);
  const size = sizeMatch ? Number(sizeMatch[1]) : state.size;
  const moveMatches = Array.from(input.matchAll(/;?\s*([BW])\s*\[([a-z]{0,2})\]/gi));

  if (![9, 13, 19].includes(size) || !moveMatches.length) return null;

  const moves = moveMatches.map((match) => ({
    color: match[1].toUpperCase(),
    point: sgfCoordToPoint(match[2].toLowerCase(), size),
    pass: !match[2]
  }));

  return { size, moves };
}

function parsePlainMoves(input, size = state.size) {
  const moves = [];
  const lines = input.split(/\n+/);

  for (const line of lines) {
    const normalized = line.replace(/^\s*\d+[\).:-]?\s*/, "").trim();
    if (!normalized) continue;

    const match = normalized.match(/^([BW]|black|white|negras|blancas)\s+([A-HJ-T]\s*\d{1,2}|pass|pasa)$/i);
    if (!match) continue;

    const colorToken = match[1].toLowerCase();
    const color = ["b", "black", "negras"].includes(colorToken) ? BLACK : WHITE;
    const pointToken = match[2].toLowerCase();
    moves.push({
      color,
      point: pointToken === "pass" || pointToken === "pasa" ? null : parsePointName(match[2], size),
      pass: pointToken === "pass" || pointToken === "pasa"
    });
  }

  return moves.length ? { size, moves } : null;
}

function importMoves() {
  const input = els.importText.value.trim();
  if (!input) {
    setStatus("Pega SGF o una lista de jugadas antes de importar.");
    return;
  }

  const parsed = parseSgf(input) || parsePlainMoves(input, state.size);
  if (!parsed) {
    setStatus("No he reconocido el formato. Prueba SGF o lineas tipo: 1. B Q16");
    return;
  }

  state.size = parsed.size;
  state.mode = "game";
  els.boardSize.value = String(parsed.size);
  const result = rebuildFromMoves(parsed.moves);

  if (!result.ok) {
    resetBoard(parsed.size);
    setStatus(result.reason);
    return;
  }

  const lastColor = state.moves.length ? state.moves[state.moves.length - 1].color : WHITE;
  els.nextColor.value = otherColor(lastColor);
  setStatus(`Importadas ${state.moves.length} jugadas.`);
  render();
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(`${label} copiado al portapapeles.`);
  } catch {
    els.outputText.focus();
    els.outputText.select();
    setStatus("No se pudo copiar automaticamente; el texto queda seleccionado.");
  }
}

function loadSample() {
  els.importText.value = "(;GM[1]FF[4]SZ[19];B[pd];W[dp];B[pp];W[dd];B[fq];W[cn];B[jp];W[qn])";
  importMoves();
}

function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  if (mode === "draw") {
    state.moves = [];
    state.captures = { B: 0, W: 0 };
  }
  setStatus(mode === "draw" ? "Modo dibujar tablero." : "Modo partida.");
  render();
}

els.boardSize.addEventListener("change", () => resetBoard(Number(els.boardSize.value)));
els.passMove.addEventListener("click", passMove);
els.undoMove.addEventListener("click", undoMove);
els.clearBoard.addEventListener("click", () => resetBoard(state.size));
els.sampleGame.addEventListener("click", loadSample);
els.importMoves.addEventListener("click", importMoves);
els.copyAscii.addEventListener("click", () => copyText(asciiBoard(), "ASCII"));
els.copyMoves.addEventListener("click", () => {
  if (state.mode === "draw") {
    copyText(sgfText(), "SGF");
    return;
  }
  copyText(movesList(), "Lista de jugadas");
});
els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});
els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeTab = tab.dataset.tab;
    renderOutput();
  });
});

resetBoard(19);

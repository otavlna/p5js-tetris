const GRID_CELL_SIZE = 30;
const GRID_CELLS_X = 10;
const GRID_CELLS_Y = 20;
const PERIOD_MILLIS = 500;
const KEY_DOWN_PERIOD_MILLIS = 50;
const NEW_SHAPE_POSITION = [5, 0];

const shapeTypes = [
  {
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    color: [0, 255, 255],
  },
  {
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [-1, 2],
    ],
    color: [0, 0, 255],
  },
  {
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    color: [255, 165, 0],
  },
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    color: [255, 255, 0],
  },
  {
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 1],
    ],
    color: [0, 255, 0],
  },
  {
    cells: [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, 1],
    ],
    color: [128, 0, 128],
  },
  {
    cells: [
      [0, 0],
      [-1, 0],
      [0, 1],
      [1, 1],
    ],
    color: [255, 0, 0],
  },
];

class Shape {
  constructor(cells, color) {
    this.id = idCounter++;
    this.cells = cells;
    this.color = color;
    this.rootPosition = [...NEW_SHAPE_POSITION];
  }

  move(direction) {
    this.rootPosition[0] += direction[0];
    this.rootPosition[1] += direction[1];
  }

  moveIfPossible(direction) {
    if (!this.collidesOnDirection(direction)) {
      this.move(direction);
    }
  }

  moveCellsAboveLine(line) {
    this.cells = this.cells.map((cell) => {
      if (cell[1] + this.rootPosition[1] < line) return cell;
      return [cell[0], cell[1] + this.rootPosition[1] - 1];
    });
  }

  collidesOnDirection(direction) {
    direction = direction ? direction : [0, 0];

    // grid cells
    for (const cell of this.cells) {
      const x = this.rootPosition[0] + cell[0] + direction[0];
      const y = this.rootPosition[1] + cell[1] + direction[1];
      if (grid[y] !== undefined && grid[y][x] !== null) {
        return true;
      }
    }

    // boundaries
    for (const cell of this.cells) {
      if (
        this.rootPosition[0] + cell[0] + direction[0] < 0 ||
        this.rootPosition[0] + cell[0] + direction[0] > GRID_CELLS_X - 1 ||
        this.rootPosition[1] + cell[1] + direction[1] < 0 ||
        this.rootPosition[1] + cell[1] + direction[1] > GRID_CELLS_Y - 1
      ) {
        return true;
      }
    }
  }

  rotate() {
    const rotatedCells = [];
    for (const cell of this.cells) {
      rotatedCells.push([cell[1], -cell[0]]);
    }
    this.cells = rotatedCells;
  }

  rotateIfPossible() {
    const oldCells = this.cells;
    this.rotate();
    if (this.collidesOnDirection([0, 0])) {
      this.cells = oldCells;
    }
  }

  removeCellsAtLine(line) {
    this.cells = this.cells.filter(
      (cell) => cell[1] + this.rootPosition[1] !== line
    );
  }

  draw() {
    fill(...this.color);
    this.cells.forEach((cell) => {
      rect(
        (this.rootPosition[0] + cell[0]) * GRID_CELL_SIZE,
        (this.rootPosition[1] + cell[1]) * GRID_CELL_SIZE,
        GRID_CELL_SIZE,
        GRID_CELL_SIZE
      );
    });
  }
}

let activeShape = null;
const grid = [];
let lastTime = 0;
let lastTimeKeyDown = 0;
let idCounter = 0;
let gameOver = false;
let score = 0;

function generateGrid() {
  for (let i = 0; i < GRID_CELLS_Y; i++) {
    grid.push([]);
    for (let j = 0; j < GRID_CELLS_X; j++) {
      grid[i].push(null);
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateNewShape() {
  const randomIndex = getRandomInt(shapeTypes.length);
  const randomShapeType = shapeTypes[randomIndex];
  activeShape = new Shape(
    [...randomShapeType.cells],
    [...randomShapeType.color]
  );
  return activeShape;
}

function advanceTime() {
  const currentTime = performance.now();
  if (lastTime === 0) {
    lastTime = currentTime;
    return false;
  } else if (lastTime + PERIOD_MILLIS < currentTime) {
    lastTime = lastTime + PERIOD_MILLIS;
    return true;
  }
  return false;
}

function moveShape() {
  const moveDirection = [0, 1];
  if (!activeShape.collidesOnDirection(moveDirection)) {
    activeShape.move(moveDirection);
  } else {
    putShapeToGrid();
    handleFullLines();
    const newShape = generateNewShape();
    if (newShape.collidesOnDirection([0, 0])) {
      gameOver = true;
      console.log("game over");
    }
  }
}

function putShapeToGrid() {
  activeShape.cells.forEach((cell) => {
    grid[cell[1] + activeShape.rootPosition[1]][
      cell[0] + activeShape.rootPosition[0]
    ] = activeShape.color;
  });
  activeShape = null;
}

function handleFullLines() {
  for (let i = 0; i < GRID_CELLS_Y; i++) {
    if (grid[i].every((cell) => cell !== null)) {
      grid.splice(i, 1);
      grid.unshift(new Array(GRID_CELLS_X).fill(null));
      i--;
      score++;
    }
  }
}

function drawGridCells() {
  for (let i = 0; i < GRID_CELLS_Y; i++) {
    for (let j = 0; j < GRID_CELLS_X; j++) {
      if (grid[i][j] !== null) {
        fill(...grid[i][j]);
        rect(
          j * GRID_CELL_SIZE,
          i * GRID_CELL_SIZE,
          GRID_CELL_SIZE,
          GRID_CELL_SIZE
        );
      }
    }
  }
}

function renderScore() {
  textSize(32);
  fill(0);
  textAlign(LEFT);
  text(score, 10, 30);
}

function renderGameOver() {
  textSize(32);
  fill(0);
  textAlign(CENTER);
  text(
    "Game Over",
    (GRID_CELL_SIZE * GRID_CELLS_X) / 2,
    (GRID_CELL_SIZE * GRID_CELLS_Y) / 2
  );
}

function setup() {
  createCanvas(GRID_CELL_SIZE * GRID_CELLS_X, GRID_CELL_SIZE * GRID_CELLS_Y);
  generateGrid();
  generateNewShape();
}

function draw() {
  background(220);

  if (!gameOver) {
    const shouldMoveShape = advanceTime();
    if (shouldMoveShape) {
      moveShape();
    }
  }

  activeShape.draw();
  drawGridCells();

  if (
    keyIsDown(DOWN_ARROW) &&
    performance.now() - lastTimeKeyDown > KEY_DOWN_PERIOD_MILLIS
  ) {
    lastTimeKeyDown = performance.now();
    activeShape.moveIfPossible([0, 1]);
  }

  renderScore();
  if (gameOver) {
    renderGameOver();
  }
}

function keyPressed() {
  if (!gameOver) {
    if (keyCode === LEFT_ARROW) {
      activeShape.moveIfPossible([-1, 0]);
    } else if (keyCode === RIGHT_ARROW) {
      activeShape.moveIfPossible([1, 0]);
    } else if (keyCode === UP_ARROW) {
      activeShape.rotateIfPossible();
    }
  }
}

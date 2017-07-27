/**
 * @author Guido Schoepp
 */

// TODO: rewrite engine.js, integrate in some kind of Board class
// TODO: display sprite when collision detected
// TODO: timed game, display "game over" dialog
// TODO: increase number of bugs with the number of points
 
/** The global configuration of the game board. */
var Board = {
    /** width of one tile/column of the board */
    TILE_WIDTH: 101,
    /** height of one tile/row of the board */
    TILE_HEIGHT: 83,
    /** number of columns of the board */
    NUM_COLS: 5,
    /** number of rows of the board */
    NUM_ROWS: 6,
    /** minimum row, where enemies can occur */
    MIN_ENEMY_ROW: 1,
    /** number of rows, where enemies can occur */
    NUM_ENEMY_ROWS: 3,
    /** value for acceptable overlapping at hit detection */
    HIT_INSET: 15,
    /** Y offset of player icon inside the tile */
    PLAYER_YOFFSET: -20,
    /** speed for fading the player after reaching water. The higher, the slower */
    PLAYER_FADE: 50,
    ENEMY_YOFFSET: 18,
    /** points for reaching water */
    SCORE_WATER: 1000,
    /** points for colliding with an enemy */
    SCORE_ENEMY: -100
};

/** The array containing all {@link Enemy}s. */
var allEnemies = [];

/** The global {@link Player} object. */
var player;

/** The global {@link ScoreBoard} object. */
var scoreBoard;

/** The global {@link StartScreen} object. */
var startScreen;

/**
 * Represents the score board.
 * @constructor
 */
var ScoreBoard = function() {
    this.reset();
};

/** Initialize the score board instance. Called after all resources are loaded. */
ScoreBoard.prototype.init = function() {
    this.reset();
};

/** Reset the the score board variables. */
ScoreBoard.prototype.reset = function() {
    this.score = 0;
    this.points = 0;
};

/** Increase points for reaching water zone. */
ScoreBoard.prototype.scoreWaterReached = function() {
    this.points += Board.SCORE_WATER;
};

/** Decrease points for hitting an enemy. */
ScoreBoard.prototype.scoreEnemyContact = function() {
    this.points += Board.SCORE_ENEMY;
};

/**
 * Render the score board.
 * @param {CanvasRenderingContext2D} ctx - The rendering context.
 */
ScoreBoard.prototype.render = function(ctx) {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(0, 0, ctx.canvas.width, 50);
    ctx.fillRect(0, ctx.canvas.height-20, ctx.canvas.width, 20);
    ctx.fillStyle = 'black';
    ctx.font = "30px 'Bangers', cursive";
    ctx.fillText('Score: '+this.score.toLocaleString(), 10, 40);
};

/** Update the score by adding the points added before. */
ScoreBoard.prototype.update = function() {
    this.score = Math.max(0, this.score + this.points);
    this.points = 0;
};


/**
 * Represents the start screen dialog
 * including the character selection
 * @constructor
 */
var StartScreen = function() {
    this.visible = true;
    this.sprites = [
        'char-boy',
        'char-cat-girl',
        'char-horn-girl',
        'char-pink-girl',
        'char-princess-girl'
    ];
    this.spriteIdx = 0;
};

/** Initialize the start screen instance. Called after all resources are loaded. */
StartScreen.prototype.init = function() {
};

/**
 * Draw text with a given size and increase the
 * current y position for the next output.
 * @method
 * @param {CanvasRenderingContext2D} ctx - The rendering context.
 * @param {string} text - The line to be drawn.
 * @param {int} size - Font size of the line.
 */
StartScreen.prototype.printLine = function(ctx, text, size) {
    ctx.font = size + "px 'Bangers', cursive";
    ctx.fillText(text, 10, this.y += (size+5));
};

/**
 * Render the start screen.
 * @param {CanvasRenderingContext2D} ctx - The rendering context.
 */
StartScreen.prototype.render = function(ctx) {
    if (!this.visible) {
        return;
    }
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#4d004d';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height-20);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height-20);

    this.y = 0;
    ctx.fillStyle = 'white';
    this.printLine(ctx, 'Game Rules', 80);
    this.printLine(ctx, '\u25B6 Move the player with the arrow keys', 33);
    this.printLine(ctx, '\u25B6 Score by reaching the water', 33);
    this.printLine(ctx, '\u25B6 Don\'t touch the ladybugs', 33);
    this.printLine(ctx, '\u25B6 Press q to quit the game', 33);
    this.printLine(ctx, '', 36);
    this.printLine(ctx, 'Choose character:', 36);
    this.printLine(ctx, '(press left or right arrow)', 20);

    var img = Resources.get(this.getSpriteName());
    if (img != null) {
        ctx.drawImage(img, (ctx.canvas.width - img.width) / 2, this.y - 20);
    }
    this.y += 180;

    this.printLine(ctx, 'Press SPACE to start', 36);
};

/** Update the start screen. To use to implement animations. */
StartScreen.prototype.update = function() {
};

/**
 * Get name of currently selected sprite for the player.
 * @returns {string} The name of the selected sprite
 */
StartScreen.prototype.getSpriteName = function() {
    return 'images/'+this.sprites[this.spriteIdx]+'.png';
};

/**
 * Set visible state of the start screen
 * @method
 * @param {boolean} visible - "false" to hide, "true" to show dialog.
 */
StartScreen.prototype.setVisible = function(visible) {
    this.visible = visible;
};

/**
 * Handle input for start screen
 * 'left', 'right' keys for character/sprite selection
 * 'space' for starting the game
 * @method
 * @param {boolean} key - name of the key.
 * @returns {boolean} true if input was handled, false otherwise
 */
StartScreen.prototype.handleInput = function(key) {
    if (!this.visible) {
        return false;
    }
    if (key === 'left') {
        this.spriteIdx = Math.max(0, this.spriteIdx - 1);
    }
    else if (key === 'right') {
        this.spriteIdx = Math.min(this.sprites.length - 1, this.spriteIdx + 1);
    }
    else if (key === 'space') {
        this.visible = false;
    }
    return true;
};


/**
 * An item represents a game component like enemy, player, etc.
 * @constructor
 */
var Item = function(sprite) {
    this.x = 0;
    this.y = 0;
    this.row = 0;
    this.sprite = sprite;
    this.width = 0;
};

/**
 * Update the item's position or other features
 * (like fading) for the animation.
 * @method
 * @param {boolean} dt - a time delta between ticks
 */
Item.prototype.update = function(dt) {
};

/**
 * Draw the item on the screen.
 * @param {CanvasRenderingContext2D} ctx - The rendering context.
 */
Item.prototype.render = function(ctx) {
    if (this.sprite == null) {
        return;
    }
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * Check if there's an intersection between us and another object
 * @method
 * @param {boolean} obj - other object to check intersection with
 * @returns {boolean} true if object intersects, false otherwise
 */
Item.prototype.intersects = function(obj) {
    var r1 = {
        left: this.x + Board.HIT_INSET,
        right: this.x + this.width - Board.HIT_INSET
    },
    r2 = {
        left: obj.x + Board.HIT_INSET,
        right: obj.x + obj.width - Board.HIT_INSET
    };
    return (
        (obj instanceof Item) &&
         this.row == obj.row &&
         r1.left <= r2.right &&
         r2.left <= r1.right
    );
};

/** Initialize the Item instance. Called after all resources are loaded. */
Item.prototype.init = function() {
    // The img is only available on reset call,
    // so initialize the width here:
    var img = Resources.get(this.sprite);
    if (this.width == 0 && img != null) {
        this.width = img.width;
    }
};

/**
 * Represents an enemy the player must avoid.
 * @augments Item
 * @constructor
 */
var Enemy = function() {
    Item.call(this, 'images/enemy-bug.png');
    this.reset();
};

Enemy.prototype = Object.create(Item.prototype);
Enemy.prototype.constructor = Enemy;

/**
 * Update the enemy's position.
 * @method
 * @param {boolean} dt - a time delta between ticks
 */
Enemy.prototype.update = function(dt) {
    /**
     * Multiply any movement by the dt parameter.
     * which will ensure the game runs at the same
     * speed for all computers.
     */
    this.x += (this.speed * dt);
    if (this.x > (Board.TILE_WIDTH * Board.NUM_COLS)) {
        this.reset();
    }
};

/** Reset the enemy's variables. Called at initialization and after enemy goes off screen. */
Enemy.prototype.reset = function() {
    this.row = Math.floor(Math.random() * Board.NUM_ENEMY_ROWS) + Board.MIN_ENEMY_ROW;
    this.y = this.row * Board.TILE_HEIGHT - Board.ENEMY_YOFFSET;
    this.x = -Board.TILE_WIDTH;
    var speedFx = Math.floor(Math.random() * 4) + 1;
    this.speed = 50 * speedFx;
};


/**
 * Represents an player.
 * @augments Item
 * @constructor
 */
var Player = function() {
    Item.call(this, 'images/char-boy.png');
    this.reset();
};

Player.prototype = Object.create(Item.prototype);
Player.prototype.constructor = Player;

/**
 * Update the player's position and detect collisions.
 * @method
 * @param {boolean} dt - a time delta between ticks
 */
Player.prototype.update = function(dt) {
    this.sprite = startScreen.getSpriteName();
    this.updatePos();
    this.detectEnemyContact();
};

/**
 * Update the player's x,y position from it's row/column position.
 * Player's position is internally handled in rows/columns.
 */
Player.prototype.updatePos = function() {
    this.x = this.col * Board.TILE_WIDTH;
    this.y = this.row * Board.TILE_HEIGHT + Board.PLAYER_YOFFSET;
};

/**
 * Handle input for player
 * 'left', 'right', 'up', 'down' keys for character/sprite selection
 * 'q' to quit the game
 * @method
 * @param {boolean} key - name of the key.
 */
Player.prototype.handleInput = function(key) {
    if (this.fadeCounter > 0) {
        return;
    }
    if (key === 'left') {
        this.moveLeft();
    }
    else if (key === 'right') {
        this.moveRight();
    }
    else if (key === 'up') {
        this.moveUp();
    }
    else if (key === 'down') {
        this.moveDown();
    }
    else if (key === 'q') {
        scoreBoard.reset();
        startScreen.setVisible(true);
    }
};

/** Move player left. */
Player.prototype.moveLeft = function() {
    if (this.col > 0) {
        this.col -= 1;
    }
};

/** Move player right. */
Player.prototype.moveRight = function() {
    if ((this.col + 1) < Board.NUM_COLS) {
        this.col += 1;
    }
};

/** Move player up. */
Player.prototype.moveUp = function() {
    if (this.row > Board.MIN_ENEMY_ROW) {
        this.row -= 1;
    } else {
        this.row -= 1;
        this.updatePos();
        scoreBoard.scoreWaterReached();
        this.fadeCounter = Board.PLAYER_FADE;
    }
};

/** Move player down. */
Player.prototype.moveDown = function() {
    if ((this.row + 1) < Board.NUM_ROWS) {
        this.row += 1;
    }
};

/** Detect if any enemy is hit. Refers to the {@link allEnemies} global variable. */
Player.prototype.detectEnemyContact = function() {
    var i, enemy;
    for (i = 0; i < allEnemies.length; i++) {
        enemy = allEnemies[i];
        if (this.intersects(enemy)) {
            scoreBoard.scoreEnemyContact();
            this.reset();
            break;
        }
    }
};

/**
 * Draw player on the screen.
 * @param {CanvasRenderingContext2D} ctx - The rendering context.
 */
Player.prototype.render = function(ctx) {
    ctx.globalAlpha = (this.fadeCounter == 0 ? 1 : (this.fadeCounter / Board.PLAYER_FADE));
    Item.prototype.render.call(this, ctx);
    ctx.globalAlpha = 1;

    if (this.fadeCounter > 1) {
        this.fadeCounter--;
    } else if (this.fadeCounter == 1) {
        this.reset();
    }
};

/** Reset player's position and state. Called after player reaches water or hit an enemy. */
Player.prototype.reset = function() {
    this.fadeCounter = 0;
    this.col = Math.floor(Board.NUM_COLS / 2);
    this.row = Board.NUM_ROWS - 1;
    this.updatePos();
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        32: 'space',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        81: 'q'
    };
    if (!startScreen.handleInput(allowedKeys[e.keyCode])) {
        player.handleInput(allowedKeys[e.keyCode]);
    }
});


// Initialize global variables
for (var i=0; i<5; i++) {
    allEnemies.push(new Enemy());
}
player = new Player();
scoreBoard = new ScoreBoard();
startScreen = new StartScreen();

var initial_pos = [300,200];
var original_game_speed = 1;
var game_speed = original_game_speed;
var board = [];
var aliment_ratio = 0.0025;
var mortal_aliment_ratio = 0.000175;
var margin = 150;

var player;
var cam;

var division_factor = 4;

var p_original_size = 10;
var p_augmenting_factor = 0.5;

var p_positive_aliment = 0.7;
var scaling = 5;
var original_scaling = 5;
var x_pixels;
var y_pixels;

var Highscore = 0;

var screenCenter = [x_pixels/2, y_pixels/2];

var camera_range;

var dead = false;

function setup() {
	x_pixels = displayWidth;
	y_pixels = displayHeight;
	createCanvas(x_pixels, y_pixels);
	frameRate(60);
	camera_range = [floor(x_pixels/scaling), floor(y_pixels/scaling)];
	restartGame();
}

function restartGame() {
	board = [];
	for (i = 0; i < x_pixels; i++) {
		var row = [];
		for (j = 0; j < y_pixels; j++) {
			if (random(1) <= mortal_aliment_ratio) row[j] = new MortalAliment([i,j]);
			else if (random(1) <= aliment_ratio) row[j] = new Aliment([i,j]);
			else row[j] = null;
		}
		board[i] = row;
	}
	player = new Player();
	cam = new Camera();
}

function draw() {
	if (dead) {
		restartGame();
		dead = false;
	}
	clear();
	fill(0,0,0);

	textSize(25);
	Highscore = max(player.size, Highscore)
	strokeWeight(2);
	line(0,0,0,y_pixels);
	line(0,0,x_pixels,0);
	line(x_pixels,0,x_pixels,y_pixels);
	line(0,y_pixels,x_pixels,y_pixels);
	updatePosition();
	cam.updatePosition();
	cam.draw();
	checkAliments();

	scaling = max((original_scaling)*(1/((player.size*p_augmenting_factor)/p_original_size)), original_scaling-2.5);
	console.log(scaling)
	camera_range = [floor(x_pixels/scaling), floor(y_pixels/scaling)];
	//game_speed = floor(original_game_speed*(player.size/p_original_size));
	fill(0,0,0);
  	text("High Score: "+Highscore, (x_pixels-margin)-150, 25);
  	text("Size: "+player.size, (x_pixels-margin)-150, 75);
}

function updatePosition() {
	dir = getNormalizedDir();
	//console.log("Direction = "+dir)
	player.position[0] += floor(dir[0]*game_speed);
	player.position[1] += floor(dir[1]*game_speed);
	player.position[0] = min( x_pixels, max(0, player.position[0]));
	player.position[1] = min( y_pixels, max(0, player.position[1]));
}

function checkAliments() {
	for (var i = cam.position[0]; i < cam.position[0]+camera_range[0]; i++) {
		for (var j = cam.position[1]; j < cam.position[1]+camera_range[1]; j++) {
			try {
				//console.log(board[i][j])
				if (board[i][j] != null) {
					if (board[i][j].type == "Aliment") {
						if (computeDistance([i,j]) < player.size/2) {
							aliment = board[i][j]
							if (aliment.positive) player.size+=aliment.value/10;
							else player.size-=aliment.value/10;
							board[i][j] = null;
						}
					}
					else if (board[i][j].type == "MortalAliment" & computeDistance([i,j]) < player.size) {
						board[i][j] = null;
						console.log("Ate a MortalAliment")
						dead = true;
						return;
					}
				}
			}
			catch {
				console.log("cam pos = "+cam.position)
				console.log([i,j])
				//console.log(board)
			}
		}
	}
}

//======================================= UTILITIES ======================================

function getNormalizedDir() {
	dist_ = computeMouseDistance();
	screenPos = scope2screen(full2scope(player.position));
	var mousex = mouseX-screenPos[0];
	var mousey = mouseY-screenPos[1];
	//console.log("mousex = "+mousex+", mousey = "+mousey);
	var xmov = floor(mousex/(x_pixels/division_factor));
	var ymov = floor(mousey/(y_pixels/division_factor));

	if (dist_ < player.size) return [0,0];
	else if (abs(mousex) < player.size/2) return [0,ymov+(mousey/abs(mousey))];
	else if (abs(mousey) < player.size/2) return [xmov+(mousex/abs(mousex)), 0];
	else return [xmov+(mousex/abs(mousex)), ymov+(mousey/abs(mousey))];
}

function computeMouseDistance() {
	screenPos = scope2screen(full2scope(player.position));
	a = mouseX-screenPos[0];
	b = mouseY-screenPos[1];
	return sqrt(a*a + b*b);
}

function computeDistance(alimentPos) {
	a = alimentPos[0]-player.position[0];
	b = alimentPos[1]-player.position[1];
	return sqrt(a*a + b*b);
}

function getRandomColor() {
	return ( floor(random(255)), floor(random(255)), floor(random(255)) );
}

function full2scope(pos) {
	return [pos[0]-cam.position[0], pos[1]-cam.position[1]];
}

function scope2screen(pos) {
	return [pos[0]*scaling, pos[1]*scaling];
}

//======================================= CELL CLASSES ======================================

class Cell {
	constructor() {
		this.type = "Error";
	}

	draw() {

	}
}


class Aliment extends Cell {
	constructor(position) {
		super();
		this.type = "Aliment";
		this.positive = random(1) <= p_positive_aliment;
		this.value = floor(random(2))+3;
		this.color = getRandomColor();
		this.position = position;
	}

	draw() {
		if (this.positive) fill(0,255,0);
		else fill(255,0,0);
		var screenPos = scope2screen(full2scope(this.position));
		ellipse(screenPos[0], screenPos[1], this.value*scaling, this.value*scaling);
	}
}

class MortalAliment extends Cell {
	constructor(position) {
		super();
		this.type = "MortalAliment";
		this.size = 10;
		this.position = position;
	}

	draw() {
		fill(0,0,0);
		var screenPos = scope2screen(full2scope(this.position));
		ellipse(screenPos[0], screenPos[1], this.size*scaling, this.size*scaling);
	}
}

class Player extends Cell {
	constructor() {
		super();
		this.type = "Player";
		this.size = p_original_size;
		this.text = "Player";
		this.color = (0,255,0);
		this.text_color = (0,0,0);
		this.position = [initial_pos[0], initial_pos[1]];
	}

	draw() {
		fill(0,0,255);
		var screenPos = scope2screen(full2scope(this.position));
		ellipse(screenPos[0], screenPos[1], this.size*scaling, this.size*scaling);
	}
}

//======================================= CAMERA CLASSES ======================================

class Camera {
	constructor(target) {
		this.position = [player.position[0] - floor(camera_range[0]/2), 
							player.position[1] - floor(camera_range[1]/2)] ; //top left corner
		this.range = camera_range;
		this.target = target;
	}

	draw() {
		for (var i = this.position[0]; i < this.position[0]+camera_range[0]; i++) {
			for (var j = this.position[1]; j < this.position[1]+camera_range[1]; j++) {
				if (board[i][j] != null) board[i][j].draw();
			}
		}
		player.draw();
	}

	updatePosition() {
		this.position = [   min(x_pixels-camera_range[0], max(0, player.position[0] - floor(camera_range[0]/2))), 
							min(y_pixels-camera_range[1], max(0, player.position[1] - floor(camera_range[1]/2))) ] ; //top left corner
		
	}
}
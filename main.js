var initial_pos = [300,200];
var game_speed = 1;
var board = [];
var aliment_ratio = 0.0025;
var mortal_aliment_ratio =  0.00025;
var margin = 150;

var player;
var cam;

var scaling = 5;
var original_scaling = 5;
var x_pixels = 1280;
var y_pixels = 720;

var Highscore = 0;

var screenCenter = [x_pixels/2, y_pixels/2];

var camera_range;

var dead = false;

function setup() {
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
			else row[j] = new NoneCell();
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
  	text("High Score: "+Highscore, (x_pixels-margin)-60, 25);
  	text("Size: "+player.size, (x_pixels-margin)-60, 75);
	strokeWeight(2);
	line(0,0,0,y_pixels);
	line(0,0,x_pixels,0);
	line(x_pixels,0,x_pixels,y_pixels);
	line(0,y_pixels,x_pixels,y_pixels);
	updatePosition();
	cam.updatePosition();
	cam.draw();
	checkAliments();

	//scaling = original_scaling-(player.size/10);
	//camera_range = [floor(x_pixels/scaling), floor(y_pixels/scaling)];
}

function updatePosition() {
	dir = getNormalizedDir();
	player.position[0] += dir[0];
	player.position[1] += dir[1];
	player.position[0] = min( x_pixels, max(0, player.position[0]));
	player.position[1] = min( y_pixels, max(0, player.position[1]));
}

//======================================= UTILITIES ======================================

function checkAliments() {
	for (var i = cam.position[0]; i < cam.position[0]+camera_range[0]; i++) {
		for (var j = cam.position[1]; j < cam.position[1]+camera_range[1]; j++) {
			try {
				if (board[i][j].type == "Aliment") {
					if (computeDistance([i,j]) < player.size/2) {
						aliment = board[i][j]
						if (aliment.positive) player.size+=aliment.value/10;
						else player.size-=aliment.value/10;
						board[i][j] = new NoneCell();
					}
				}
				else if (board[i][j].type == "MortalAliment" & computeDistance([i,j]) < player.size/2) {
					board[i][j] = new NoneCell();
					console.log("Ate a MortalAliment")
					dead = true;
					return;
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


function getNormalizedDir() {
	screenPos = scope2screen(full2scope(player.position));
	var mousex = mouseX-screenPos[0];
	var mousey = mouseY-screenPos[1];
	if (mousex == 0 || mousey == 0) return [0,0];
	return [floor(game_speed*(mousex/abs(mousex))), floor(game_speed*(mousey/abs(mousey)))];
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

class NoneCell extends Cell {
	constructor() {
		super();
		this.type = "NoneCell";
	}

	draw() {

	}
}

class Aliment extends Cell {
	constructor(position) {
		super();
		this.type = "Aliment";
		this.positive = random(1) <= 0.5;
		this.value = floor(random(3))+1;
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
		this.size = 10;
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
				board[i][j].draw();
			}
		}
		player.draw();
	}

	updatePosition() {
		this.position = [   min(x_pixels-camera_range[0], max(0, player.position[0] - floor(camera_range[0]/2))), 
							min(y_pixels-camera_range[1], max(0, player.position[1] - floor(camera_range[1]/2))) ] ; //top left corner
		
	}
}
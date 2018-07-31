var initial_pos = [300,200];
var original_game_speed = 1;
var game_speed = original_game_speed;
var board = [];
var aliment_ratio = 0.0025;
var mortal_aliment_ratio = 0.000025;
var margin = 150;

var player;
var cam;

var division_factor = 7;

var aliment_growing_factor = 0.05;

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

var cpu_speed = 1.5;
var cpu_players = [];
var number_cpu_players = 5;
var p_random_move = 0.25;

var minimapRes = [192*2,108*2];

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
	for (var i = 0; i < number_cpu_players; i++) cpu_players[i] = new CpuPlayer(i);
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
	moveCpu();
	updatePosition();
	cam.updatePosition();
	cam.draw();
	checkPosition();

	scaling = max((original_scaling)*(1/((player.size*p_augmenting_factor)/p_original_size)), original_scaling-2.5);
	camera_range = [floor(x_pixels/scaling), floor(y_pixels/scaling)];
	fill(0,0,0);
  	text("High Score: "+floor(Highscore), (x_pixels-margin)-150, 25);
  	text("Size: "+floor(player.size), (x_pixels-margin)-150, 75);
  	text("Position "+player.position, (x_pixels-margin)-150, 175);
}

function updatePosition() {
	dir = getNormalizedDir();
	text("Direction: "+dir, (x_pixels-margin)-150, 125);
	//console.log("Direction = "+dir)
	player.position[0] += floor(dir[0]*game_speed);
	player.position[1] += floor(dir[1]*game_speed);
	player.position[0] = min( x_pixels, max(0, player.position[0]));
	player.position[1] = min( y_pixels, max(0, player.position[1]));
}

function checkPosition() {
	for (var i = 0; i < number_cpu_players; i++) {
		var cpuPos = cpu_players[i].position;
		if (computeDistance([cpuPos[0], cpuPos[1]]) < player.size/2) {
			dead = true;
				return;
		}
	}
	for (var i = cam.position[0]; i < cam.position[0]+camera_range[0]; i++) {
		for (var j = cam.position[1]; j < cam.position[1]+camera_range[1]; j++) {
			//console.log(board[i][j])
			if (board[i][j] != null) {
				if (board[i][j].type == "Aliment") {
					if (computeDistance([i,j]) < player.size/2) {
						aliment = board[i][j]
						if (aliment.positive) player.size+=aliment.value*aliment_growing_factor;
						else player.size-=aliment.value*aliment_growing_factor;
						board[i][j] = null;
					}
				}
				else if (board[i][j].type == "MortalAliment" & computeDistance([i,j]) < player.size/2) {
					board[i][j] = null;
					console.log("Ate a MortalAliment")
					dead = true;
					return;
				}
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

	var xmov = floor(mousex/(x_pixels/division_factor));
	var ymov = floor(mousey/(y_pixels/division_factor));

	if (xmov < 0) xmov +=1;
	if (ymov < 0) ymov +=1;	

	var xsign = mousex/abs(mousex);
	var ysign = mousey/abs(mousey);

	if (dist_ < player.size) return [0,0];
	else if (abs(mousex) < player.size) return [0,ymov+ysign];
	else if (abs(mousey) < player.size) return [xmov+xsign, 0];
	else return [xmov+xsign, ymov+ysign];
}

function sign(x) {
	if (x < 0) return -1;
	else return 1;
}

function moveCpu() {
	screenPos = player.position;
	for (var i = 0; i < number_cpu_players; i++) {
		if (random(1) < p_random_move) {
			var dir = [floor(random(3)), floor(random(3))];
		}
		else {
			var cpuPos = cpu_players[i].position;
			var diffx = screenPos[0]-cpuPos[0];
			var diffy = screenPos[1]-cpuPos[1];

			var xdir = sign(diffx);
			var ydir = sign(diffy);

			var xmov = min(cpu_speed, abs(diffx))*xdir;
			var ymov = min(cpu_speed, abs(diffy))*ydir;
			var dir = [xmov, ymov];
		}

		cpu_players[i].position[0] += floor(dir[0]);
		cpu_players[i].position[1] += floor(dir[1]);
		cpu_players[i].position[0] = min( x_pixels, max(0, cpu_players[i].position[0]));
		cpu_players[i].position[1] = min( y_pixels, max(0, cpu_players[i].position[1]));
		text("CPU "+i+" at distance: "+floor(computeDistance(cpu_players[i].position)), (x_pixels-margin)-150, 225+50*i)
	} 
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

function screen2mini(pos) {
	return [ floor((pos[0]/x_pixels)*minimapRes[0]), floor((pos[1]/y_pixels)*minimapRes[1]) ];
}

function size2mini(size) {
	avgSize = (x_pixels+y_pixels)/2;
	avgMini = (minimapRes[0]+minimapRes[1])/2;
	return (size/avgSize)*avgMini;
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

class CpuPlayer extends Cell {
	constructor(id) {
		super();
		this.id = id;
		this.type = "CpuPlayer";
		this.size = p_original_size;
		this.position = [floor(random(1)*x_pixels), floor(random(1)*y_pixels)];
	}

	draw() {
		fill(255,255,0);
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
	}

	draw() {
		for (var i = this.position[0]; i < this.position[0]+camera_range[0]; i++) {
			for (var j = this.position[1]; j < this.position[1]+camera_range[1]; j++) {
				if (board[i][j] != null) board[i][j].draw();
			}
		}
		for (var i = 0; i < number_cpu_players; i++) cpu_players[i].draw();
		player.draw();
		fill(255,255,255);
		rect(0,0,minimapRes[0],minimapRes[1]);
		var miniPlayer = screen2mini(player.position);
		fill(0,0,255);
		ellipse(miniPlayer[0], miniPlayer[1], size2mini(player.size), size2mini(player.size));
		fill(255,255,0);
		for (var i = 0; i < number_cpu_players; i++) {
			var miniCpu = screen2mini(cpu_players[i].position);
			ellipse(miniCpu[0], miniCpu[1], size2mini(cpu_players[i].size), size2mini(cpu_players[i].size));
		}
	}

	updatePosition() {
		this.position = [   min(x_pixels-camera_range[0], max(0, player.position[0] - floor(camera_range[0]/2))), 
							min(y_pixels-camera_range[1], max(0, player.position[1] - floor(camera_range[1]/2))) ] ; //top left corner
		
	}
}
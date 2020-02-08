var localStorageCurrentStage = "planetSaver-currentStage";
var localStorageCurrentLevel = "planetSaver-currentLevel";
var currrentStage;
var maxMusicVolume = 0.2;
var maxSoundEffectsVolume = 0.75;
var maxStingerVolume = 0.3;

$( document ).ready(function() {
  	checkContinue();

	$(document).on("keyup", function(e) {
		if(e.which === 77)
			toggleMute();
		else if(!entered && e.which === 13)
			enter();
	});

	$.each($("audio, video"), function(index, element) {
		element.volume = 0;
	});
});

function checkContinue(){
	let stage = localStorage.getItem(localStorageCurrentStage);
	if(stage)
	{
		$("#main-menu ul li").eq(1)
			.removeClass("dissabled")
			.attr("onClick", "loadStage(" + stage + ")");
	}
	else
	{
		$("#main-menu ul li").eq(1).addClass("dissabled");
	}
}

var entered = false;
function enter(){
	entered = true;
	closeModal('enter-card');
	animateVolume("gameSoundtrackAudio", maxMusicVolume, 800);
}

var isMuted = false;
function toggleMute(){
	let $speaker = $("#audio-control .speaker");

	if($speaker.hasClass('mute')){
		$speaker.removeClass('mute');
		isMuted = false;
	}
	else{
		$speaker.addClass('mute');
		isMuted = true;
	}

	$.each($("audio, video"), function(index, element) {
		$(element).animate({volume: isMuted ? 0 : maxVolume}, 400);
	});
}

function playSound(element, ignoreStartOver, volume){
	if(isMuted || !element) return;
	
	if(!ignoreStartOver)
		element.currentTime = 0;

	element.volume = volume ? volume : maxSoundEffectsVolume;
	element.play()
}

function animateVolume(id, targetValue, duration){
	if(!document.getElementById(id)) return;

	document.getElementById(id).play();
	$("#" + id).animate({volume: isMuted ? 0 : targetValue}, isMuted ? 0 : duration, function(){ 
		if(targetValue === 0)
			document.getElementById(id).pause();
	});
}

function loadMainMenu(){
	checkContinue();
	$("#stage-frame").addClass("hidden-frame");
	$("#title-level-name").text("");
	$("#main-menu").removeClass("hidden-frame");
}

function startNewGame(){
	localStorage.setItem(localStorageCurrentStage, 1);
	localStorage.setItem(localStorageCurrentLevel, 1);
	loadStage();

	$("#main-menu").addClass("hidden-frame");
}

async function loadStage(stage){
	$("#stage-frame").addClass("hidden-frame");
	stage = !stage ? localStorage.getItem(localStorageCurrentStage) : stage;
	if(!stage){
		stage = 1;
		localStorage.setItem(localStorageCurrentStage, stage);
	}
	currrentStage = stage;

	$("#stage-frame-content").html(await readFile("levels/stage" + stage + ".html"));
	$("#title-level-name").text($("#stage-frame #level-title").val());
	
	let $planets = $("#stage-frame-content .planet");
	let currentLevel = stage < localStorage.getItem(localStorageCurrentStage) ? $planets.length : localStorage.getItem(localStorageCurrentLevel);
	if(!currentLevel){
		currentLevel = 1;
		localStorage.setItem(localStorageCurrentLevel, currentLevel);
	}
	
	for (let i = 1; i <= $planets.length; i++) {
		$($planets[$planets.length - i]).removeClass("planet-solved").removeClass("planet-active");
		if(i < currentLevel){
			$($planets[$planets.length - i]).addClass("planet-solved");
		}
		else if(i == currentLevel){
			$($planets[$planets.length - i]).addClass("planet-active");
		}
	}
	
	$("#stage-frame").removeClass("hidden-frame");
	$("#main-menu").addClass("hidden-frame");
	$("#level-frame").addClass("hidden-frame");
	if($planets[$planets.length - currentLevel])
		$planets[$planets.length - currentLevel].scrollIntoView({behavior: 'smooth', block: 'center'});
}

async function loadLevel(stage, level){
	let currentStage = localStorage.getItem(localStorageCurrentStage)
	if(currentStage > stage || (currentStage == stage && localStorage.getItem(localStorageCurrentLevel) < level)) return;

	$("#stage-frame").addClass("hidden-frame");
	
	$("#level-frame-content").html(await readFile("levels/level" + stage + "-" + level + ".html"));
	$("#title-level-name").text($("#level-frame #level-title").val());
	
	$("#level-frame").removeClass("hidden-frame");
	
	$.each($("#level-frame-content").find("audio, video"), function(index, element) {
		element.volume = 0;
	});

	initializeLevel(level);
}

function readFile(fileName){
	return fetch(fileName + "?" + (new Date).getTime()).then(response => {
		return response.text()
	}).then(data => {
		return data;
	});
}
const playingfieldObjectType = {
    DESTRUCTABLE: 'destructable',
    PICKUP: 'pickup',
    TRASH: 'trash',
    SHIELD: 'shield',
	AMMO: 'ammo',
	BLOCKER: 'blocker'
}

var maxGameSpeed = 2000;
var minGameSpeed = 400;
var gameSpeedMultiplier = 200;
var gameSpeedLevel;
var gameTotalShields;
var gameTargetSpawns;
var gameTargetPickups;
var gameSpawnSkip;
var gameAmmoSpawnChance;
var gameShieldSpawnChance;
var gameTrashSpawnChance;
var gameDestructableSpawnChance;
var gamePickupSpawnChance;

var $speeches;
var speechIndex;
var speechEndCallback;

var currentLevel;
var gameCycleTimer;
var gamePlaying = false;
var cursorLocation;
var currentShields;
var currentAmmo;
var currentSpawns;
var currentSpawnsDestroyed;
var currentPickupsCollected;
var $destructableTargets;
var $pickupObjects;
var $ammoObjects;
var $shieldObjects;
var $trashObjects;

function exitGame(){
	disposeTimer();
	$("body #flash-effect").remove();
	
	openModal('game-menu');
}

function continueGame(){
	if(gameCycleTimer){
		gameCycleTimer.resume();
		gamePlaying = true;
	}

	closeModal('game-menu');
}

function returnToStage(){
	animateVolume("levelSoundtrackAudio", 0, 600);
	animateVolume("gameSoundtrackAudio", maxMusicVolume, 1000);

	disposeTimer();
	closeModal('game-menu');
	loadStage(currrentStage);
}

function initializeLevel(level){
	currentLevel = level;

	$(document).off("keydown");
	$(document).on("keydown", function(e) {
		switch(e.which) {
			case 38:
			case 87:
				displayCursor(cursorLocation[0], cursorLocation[1] - 1);
				break;
			case 40:
			case 83:
				displayCursor(cursorLocation[0], cursorLocation[1] + 1);
				break;
			case 37:
			case 65:
				displayCursor(cursorLocation[0] - 1, cursorLocation[1]);
				break;
			case 39:
			case 68:
				displayCursor(cursorLocation[0] + 1, cursorLocation[1]);
				break;
			case 32:
				if(!gamePlaying)
					loadNextSpeech();
				else
					shoot(cursorLocation[0], cursorLocation[1]);
				break;
			case 67:
					pickup(cursorLocation[0], cursorLocation[1]);
				break;
			case 27:
				exitGame();
				break;
		}
	});
	
	if($("#level-frame #level-color") && $("#level-frame #level-color").val())
		$("#level-frame").css("background-color", $("#level-frame #level-color").val());
	
	currentAmmo = 0;
	currentSpawnsDestroyed = 0;
	currentPickupsCollected = 0;
	currentShields = 0;

	gameSpeedLevel = $("#level-frame #level-speed").length > 0 ? $("#level-frame #level-speed").val() : 1;

	gameTargetSpawns = $("#level-frame #level-target-spawns").length > 0 ? $("#level-frame #level-target-spawns").val() : 0;
	currentSpawns = 0;
	addSpawnsDestroyed(0);

	gameTotalShields = $("#level-frame #level-shields").length > 0 ? $("#level-frame #level-shields").val() : 1;
	
	$destructableTargets = $("#level-frame .playingfield-destructable-object");
	$pickupObjects = $("#level-frame .playingfield-pickup-object");
	$trashObjects = $("#level-frame .playingfield-trash-object");
	$ammoObjects = $(".ammo-object");
	$shieldObjects = $(".shield-object");

	gameSpawnSkip = $("#level-frame #level-skip-spawn") ? $("#level-frame #level-skip-spawn").val() : 0;

	gameAmmoSpawnChance = $("#level-frame #level-ammo-chance") ? $("#level-frame #level-ammo-chance").val() : 0;
	gameShieldSpawnChance = $("#level-frame #level-shield-chance") ? $("#level-frame #level-shield-chance").val() : 0;
	gameTrashSpawnChance = $("#level-frame #level-trash-chance") ? $("#level-frame #level-trash-chance").val() : 0;
	gameDestructableSpawnChance = $("#level-frame #level-destructable-chance") ? $("#level-frame #level-destructable-chance").val() : 0;
	gamePickupSpawnChance = $("#level-frame #level-pickup-chance") ? $("#level-frame #level-pickup-chance").val() : 0;
	
	$("#level-frame-content").append(generatePlayingField($("#level-frame #level-size").val()));

	addShields(gameTotalShields);

	addAmmo($("#level-frame #level-ammo").length > 0 ? $("#level-frame #level-ammo").val() : 0);

	setPickups(0, $("#level-frame #level-target-pickups").length > 0 ? $("#level-frame #level-target-pickups").val() : 0);
	
	if($("#levelSoundtrackAudio").length > 0){
		animateVolume("gameSoundtrackAudio", 0, 600);
		animateVolume("levelSoundtrackAudio", maxMusicVolume, 1000);
	}
	
	resetSpeech(startGame, $("#level-frame .intro-speech"));
	$speechBox = $("<div class='speech-skip'><span onClick='skipSpeech()'>Skip >></span></div><div class='speech-box' onClick='loadNextSpeech()'><div class='speech-box-text'></div><div class='speech-box-image'></div></div>")
	if($speeches.length == 0){
		$speechBox.find(".speech-box").addClass("hidden");
		$speechBox.find(".speech-skip").addClass("hidden");
	}
	$("#level-frame-content").append($speechBox);

	if($speeches.length > 0) loadNextSpeech();
	else startGame();
}

function startGame(){
	if(gamePlaying) return;
	
	$("#playing-field").removeClass("hidden-frame");
	
	disposeTimer();

	setTimeout(function(){ 
		gamePlaying = true;
		gameCycleTimer = new Timer(gameCycle, Math.max(Math.min(maxGameSpeed - gameSpeedLevel * gameSpeedMultiplier, maxGameSpeed), minGameSpeed));
	}, 400);

	playSound($("#gameStartEffectAudio")[0]);
}

function gameCycle(){
	if(!gamePlaying) return;
	
	$table = $("#level-frame-content #playing-field table");
	$movableObjects = $table.find(".playing-field-movable");
	
	if($movableObjects.length > 0)
		moveObjectsDown($movableObjects, $table);

	if($destructableTargets.length > 0)
		genearteRandomObject($destructableTargets, $table, "$destructableTargets", playingfieldObjectType.DESTRUCTABLE, gameDestructableSpawnChance);

	if($pickupObjects.length > 0)
		genearteRandomObject($pickupObjects, $table, "$pickupObjects", playingfieldObjectType.PICKUP, gamePickupSpawnChance);

	if($trashObjects.length > 0)
		genearteRandomObject($trashObjects, $table, "$trashObjects", playingfieldObjectType.TRASH, gameTrashSpawnChance);

	if(gameAmmoSpawnChance > 0)
		genearteRandomObject($ammoObjects, $table, "$ammoObjects", playingfieldObjectType.AMMO, gameAmmoSpawnChance);

	if(gameShieldSpawnChance > 0)
		genearteRandomObject($shieldObjects, $table, "$shieldObjects", playingfieldObjectType.SHIELD, gameShieldSpawnChance);
}

function shoot(centerX, centerY, $table){
	if(!gamePlaying) return;

	if(currentAmmo <= 0){
		playSound($("#outOfAmmoAudio")[0]);
		return;
	}
	
	addAmmo(-1);
	playSound($("#shootAudio")[0]);
	
	$table = !$table ? $("#level-frame-content #playing-field table") : $table;
	$targetCell = getCell($table, centerX, centerY);
	
	if(!$targetCell.hasClass("playing-field-movable") || $targetCell.attr("data-item-type") === playingfieldObjectType.BLOCKER) return;

	if($targetCell.attr("data-item-type") === playingfieldObjectType.DESTRUCTABLE){
		addSpawnsDestroyed(1);
	}

	if($targetCell.attr("data-item-type") === playingfieldObjectType.TRASH){
		let targetImage = $targetCell.css("background-image");
		let targetListName = $targetCell.attr("data-list-name");
		let targetItemIndex = $targetCell.attr("data-item-index");
		let targetItemType = $targetCell.attr("data-item-type");

		setTrashCell(getCell($table, centerX + 1, centerY), targetImage, targetListName, targetItemIndex, targetItemType);
		setTrashCell(getCell($table, centerX - 1, centerY), targetImage, targetListName, targetItemIndex, targetItemType);
		setTrashCell(getCell($table, centerX, centerY + 1), targetImage, targetListName, targetItemIndex, targetItemType);
		setTrashCell(getCell($table, centerX, centerY - 1), targetImage, targetListName, targetItemIndex, targetItemType);
	}

	playSound(window[$targetCell.attr("data-list-name")].eq($targetCell.attr("data-item-index")).find(".primarySoundEffect")[0]);
	clearCell($targetCell);
	
	if(checkLevelFail()) levelFail();
	if(checkLevelWin()) levelWin();
}

function pickup(centerX, centerY, $table){
	if(!gamePlaying) return;

	playSound($("#pickupAudio")[0]);
	
	$table = !$table ? $("#level-frame-content #playing-field table") : $table;

	resolvePickup(getCell($table, centerX + 1, centerY));
	resolvePickup(getCell($table, centerX - 1, centerY));
	resolvePickup(getCell($table, centerX, centerY + 1));
	resolvePickup(getCell($table, centerX, centerY - 1));

	if(checkLevelFail()) levelFail();
	if(checkLevelWin()) levelWin();
}

function resolvePickup($targetCell){
	if(!$targetCell || $targetCell.length === 0 || !$targetCell.hasClass("playing-field-movable")) return;

	if($targetCell.attr("data-item-type") === playingfieldObjectType.PICKUP){
		setPickups(currentPickupsCollected + 1);
	}
	if($targetCell.attr("data-item-type") === playingfieldObjectType.DESTRUCTABLE){
		addSpawnsDestroyed(1);
		addShields(-1);
	}

	if($targetCell.attr("data-item-type") === playingfieldObjectType.TRASH){
		addShields(-1);
	}
	
	if($targetCell.attr("data-item-type") === playingfieldObjectType.AMMO){
		addAmmo(Math.floor((Math.random() * 5) + 1));
	}

	if($targetCell.attr("data-item-type") === playingfieldObjectType.SHIELD){
		addShields(+1);
	}

	playSound(window[$targetCell.attr("data-list-name")].eq($targetCell.attr("data-item-index")).find(".secondarySoundEffect")[0]);
	clearCell($targetCell);
}

function moveObjectsDown($objects, $table){
	for(let i = $objects.length -1; i >= 0; i--){
		let $objectCell = $objects.eq(i);
		let $targetCell = getCell($table, $objectCell.data("column"), $objectCell.data("row") + 1);
		
		if($targetCell.length == 0 && $objectCell.attr("data-item-type") === playingfieldObjectType.DESTRUCTABLE){
			addShields(-1);
			playSound(window[$objectCell.attr("data-list-name")].eq($objectCell.attr("data-item-index")).find(".secondarySoundEffect")[0]);
			addSpawnsDestroyed(1);
		}
		
		$targetCell
			.css("background-image", $objectCell.css("background-image"))
			.attr("data-list-name", $objectCell.attr("data-list-name"))
			.attr("data-item-index", $objectCell.attr("data-item-index"))
			.attr("data-item-type", $objectCell.attr("data-item-type"))
			.addClass("playing-field-movable");
		
		clearCell($objectCell);
	}

	if(checkLevelFail()) levelFail();
	if(checkLevelWin()) levelWin();
}

function clearCell($cell){
	$cell
		.css("background-image", "none")
		.removeAttr("data-list-name")
		.removeAttr("data-item-index")
		.removeAttr("data-item-type")
		.removeClass("playing-field-movable");
}

function addAmmo(incrementValue){
	currentAmmo += +incrementValue;
	$("#playing-field .playing-field-ammo span").text(currentAmmo);
}

function setPickups(currentValue, targetValue){
	if(targetValue){
		gameTargetPickups = targetValue;
		$("#playing-field .playing-field-pickups span.playing-field-pickups-target").text(targetValue);
		if(targetValue > 0)
			$("#playing-field .playing-field-pickups").removeClass("hidden");
		else
			$("#playing-field .playing-field-pickups").addClass("hidden");
	}

	currentPickupsCollected = currentValue;
	$("#playing-field .playing-field-pickups span.playing-field-pickups-current").text(currentValue);
}

function addShields(incrementValue){
	let sizeY = $("#level-frame-content #playing-field table tr").length;
	if(currentShields + +incrementValue > sizeY)
		return;

	currentShields += +incrementValue;

	if(incrementValue > 0){
		let size = $("#level-frame-content #playing-field table tr:first-child td").length;
		for(let i = 0; i < incrementValue; i++){
			$("#level-frame-content #playing-field .playing-field-shield")
				.css("width", (100 / size / 2.3) + "%")
				.css("right", "-" + ((100 / size / 2.3) + 1.1) + "%")
				.append("<div class='playing-field-shield-element' style='height:calc(100% / " + sizeY + " - 1px);'></div>");
		}
	}
	else{
		for(let i = 0; i < (incrementValue * -1); i++){
			$("#playing-field .playing-field-shield .playing-field-shield-element").last().remove();
		}

		$("body #flash-effect").remove();
		$("body").append('<div id="flash-effect" class="full-page flash"></div>');
	}
}

function addSpawnsDestroyed(incrementValue){
	currentSpawnsDestroyed += +incrementValue;
}

function checkLevelWin(){
	if(currentSpawnsDestroyed >= gameTargetSpawns && currentPickupsCollected >= gameTargetPickups )
		return true;

	return false;
}

function checkLevelFail(){
	if(currentShields < 0)
		return true;

	return false;
}

function levelFail(){
	$speech = $("#level-frame .fail-speech");
	if($speech.length === 0){
		$("#level-frame").append($('<div class="hidden fail-speech"><span>Nooo! What are you doing, Byte?! We\'re falling! Mayday, mayday!</span><img src="sources/characters/slit.png" /></div>'));
		$speech = $("#level-frame .fail-speech");
	}
	resetSpeech(returnToStage, $speech);

	animateVolume("levelSoundtrackAudio", 0, 600);
	playSound($("#gameLoseSoundEffectAudio")[0], false, maxStingerVolume);

	levelEnd();
}

function levelWin(){
	let $speech = $("#level-frame .outro-speech");
	if($speech.length === 0){
		$("#level-frame").append($('<div class="hidden outro-speech"><span>Yes! That was amaizing, Byte! We made it!</span><img src="sources/characters/slit.png" /></div>'));
		$speech = $("#level-frame .outro-speech");
	}
	resetSpeech(returnToStage, $speech);
	
	if(localStorage.getItem(localStorageCurrentStage) == currrentStage && localStorage.getItem(localStorageCurrentLevel) == currentLevel)
		localStorage.setItem(localStorageCurrentLevel, currentLevel + 1);
	
	animateVolume("levelSoundtrackAudio", 0, 600);
	playSound($("#gameWinSoundEffectAudio")[0], false, maxStingerVolume);

	levelEnd();
}

function levelEnd(){
	setTimeout(function(){ $("body #flash-effect").remove(); }, 400);
	disposeTimer();
	loadNextSpeech();
}

function genearteRandomObject($list, $table, listName, objectType, percentChance){
	if(!$list || $list.length == 0)
		return;

	if(percentChance && Math.floor((Math.random() * 101)) >= percentChance)
		return;

	let tableWidth = $table.find("tr").eq(0).find("td").length;
	let randCol = Math.floor((Math.random() * (tableWidth)));
	let $targetedCell = getCell($table, randCol, 0);

	if($targetedCell.length === 0 || !($targetedCell.css("background-image") === "" || $targetedCell.css("background-image") === "none"))
		return;
	
	for(let i = 0; i < gameSpawnSkip; i++){
		if($table.find("tr").eq(i+ 1).find("td[data-item-type='" + objectType + "']").length !== 0) return;
	}

	if(objectType === playingfieldObjectType.DESTRUCTABLE){
		if(gameTargetSpawns > 0 && currentSpawns >= gameTargetSpawns) return
		else currentSpawns++;
	}

	let randIndex = Math.floor((Math.random() * $list.length));
	let $randItem = $list.eq(randIndex);

	setCell($targetedCell, $randItem.find("img").attr("src"), listName, randIndex, objectType);
}

function setCell($targetedCell, img, listName, randIndex, objectType){
	if(img.startsWith("url(")){
		img = img.substring(0, img.length - 1).substring(4);
	}

	$targetedCell
		.css("background-image", "url(" + img + ")")
		.attr("data-list-name", listName)
		.attr("data-item-index", randIndex)
		.attr("data-item-type", objectType)
		.addClass("playing-field-movable");
}

function setTrashCell($targetedCell, img, listName, randIndex, objectType){
	if($targetedCell.length === 0 || $targetedCell.attr("data-item-type") === playingfieldObjectType.DESTRUCTABLE)
		return;

	setCell($targetedCell, img, listName, randIndex, objectType);
}

function generatePlayingField(size){
	size = !size || size < 3 ? 3 : size;
	sizeY = size * 1.5;
	
	let $pickups = $('<div class="playing-field-stats"></div>');
	$pickups.append($('<div class="playing-field-ammo"><span></span><i class="stat-icon"></i>'));
	$pickups.append($('<div class="playing-field-pickups hidden"><span class="playing-field-pickups-current"></span><span>/</span><span class="playing-field-pickups-target"></span><i class="stat-icon"></i>'));

	let $playingField = $('<div id="playing-field" class="hidden-frame center-container"></div>');
	$playingField.append($pickups);
	$playingField.append($('<table></table>'));
	$playingField.append($('<div class="playing-field-shield"></div>'));

	for(let i = 0; i < sizeY; i++){
		let $row = $('<tr></tr>');
		for(let j = 0; j < size; j++)
		{
			$row.append("<td data-row='" + i + "' data-column='" + j + "'></td>")
		}
		
		$playingField.find("table").append($row);
	}

	displayCursor(Math.floor(size / 2), Math.ceil(sizeY) - 2, $playingField.find("table"), true);

	let numberOfBlockers = $("#level-frame #level-blockers").val();
	if(numberOfBlockers){
		$table = $playingField.find("table");
		let blockerIndex = 0;
		while(blockerIndex < numberOfBlockers){
			let $cell = getCell($table, Math.floor(Math.random() * size) , Math.floor(Math.random() * (sizeY - 2)));
			if($cell && $cell.length !== 0 && !$cell.find("div.blocker").length > 0 && !$cell.hasClass("cursorCenter")){
				$cell.append("<div class='blocker'></div>");
				blockerIndex++;
			}
		}
	}
	
	return $playingField;
}

function displayCursor(centerX, centerY, $table, init){
	if(!gamePlaying && !init) return;
	
	$table = !$table ? $("#level-frame-content #playing-field table") : $table;
	
	if(centerX < 0 || centerY < 0 || centerX >= $table.find("tr").eq(0).find("td").length || centerY >= $table.find("tr").length)
		return;
	
	if(!cursorLocation)
		cursorLocation = new Array(2);
	
	if(getCell($table, centerX, centerY).find("div.blocker").length > 0)
		return;

	cursorLocation[0] = centerX;
	cursorLocation[1] = centerY;

	$table.find("td").removeClass("cursorCenter").removeClass("cursorOffCenter");
	
	getCell($table, centerX, centerY).addClass("cursorCenter");
	getCell($table, centerX, centerY + 1).addClass("cursorOffCenter");
	getCell($table, centerX + 1, centerY).addClass("cursorOffCenter");
	if(centerY > 0)
		getCell($table, centerX, centerY - 1).addClass("cursorOffCenter");
	if(centerX > 0)
		getCell($table,  centerX - 1, centerY).addClass("cursorOffCenter");
	
	if(!init)
		playSound($("#moveAudio")[0]);
}

function getCell($table, column, row){
	if(column < 0 || row < 0) return $();
	return $table.find("tr").eq(row).find("td").eq(column);
}

let speachEnded;
function resetSpeech(callback, $speechElements){
	$speeches = $speechElements;
	speechEndCallback = callback
	speechIndex = -1;
	speachEnded = false;
	stopTyping = false;
	canLoadNextSpeech = true;
}

canLoadNextSpeech = true;
function loadNextSpeech(){
	if(!canLoadNextSpeech) return;

	canLoadNextSpeech = false;
	setTimeout(function(){ canLoadNextSpeech = true; }, 300);

	if(speechIndex + 1 >= $speeches.length)
	{
		$("#level-frame .speech-box").addClass("hidden");
		$("#level-frame .speech-skip").addClass("hidden");
		if(speechEndCallback && !speachEnded){
			speachEnded	= true;
			speechEndCallback();
		}
		return;
	}

	speechIndex++;
	typeWriter($($speeches[speechIndex]).find("span").text(), $("#level-frame .speech-box .speech-box-text"), 0, $($speeches[speechIndex]).find("b").text());
	
	if($($speeches[speechIndex]).find("img").length > 0)
		$("#level-frame .speech-box .speech-box-image").css("background-image", "url(" + $($speeches[speechIndex]).find("img").attr("src") + ")");
	
	$("#level-frame .speech-box").removeClass("hidden");
	$("#level-frame .speech-skip").removeClass("hidden");
}

var typeSpeed = 25;
var isTyping = false;
var stopTyping = false;
function typeWriter(text, $element, index, name) {
	if(!index || index === 0){
		index = 0;

		if(isTyping){
			stopTyping = true;
			setTimeout(function(){ typeWriter(text, $element, 0, name) }, typeSpeed + 5);
			return;
		}
		else{
			$element.html(name ? "<b>" + name + ": <b/>" : "");
		}
	}

	if (!stopTyping && index < text.length) {
		isTyping = true;
		$element.find(".speech-box-cursor").remove();
		$element.html($element.html() + text.charAt(index));
		$element.append('<span class="speech-box-cursor">|</span>');
		playSound(document.getElementById("keyStrokeAudio"), true);
		setTimeout(function(){ typeWriter(text, $element, index + 1) }, typeSpeed);
	}
	else{
		isTyping = false;
		stopTyping = false;
	}
}

function skipSpeech(){
	stopTyping = true;
	speechIndex = $speeches.length;

	if(isTyping)
		setTimeout(function(){ loadNextSpeech(); }, typeSpeed + 5);
	else
		loadNextSpeech();
}

function disposeTimer(){
	if(gameCycleTimer){
		gameCycleTimer.pause();
		gamePlaying = false;
	}
}

var Timer = function(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= Date.now() - start;
    };

    this.resume = function() {
        start = Date.now();
        window.clearTimeout(timerId);

        timerId = window.setTimeout(()=> {
			callback();
			remaining = delay;
			this.resume();
		}, remaining);
    };

    this.resume();
};
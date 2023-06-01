document.addEventListener('DOMContentLoaded', load)

const edge = 10;
const cellSpacing = 0.8660254037844387;
const cells = hexGrid(edge);
const HTMLElements = []
const Players = []
const Enemies = []

const enemyBuildData = {
	normalEnemy: { name: "Normal Enemy", attack: 5, defence: 5, speed: 5, lootPoints: 5, description: "A boring, normal, standard enemy" },
	stabbyEnemy: { name: "Stabby Enemy", attack: 13, defence: 1, speed: 1, lootPoints: 5, description: "A stabby enemy" },
	tankyEnemy: { name: "Sturdy Enemy", attack: 1, defence: 13, speed: 1, lootPoints: 5, description: "A sturdy enemy" },
	fastEnemy: { name: "Fast Enemy", attack: 1, defence: 1, speed: 13, lootPoints: 5, description: "A fast enemy" },
	weakEnemy: { name: "Weak Enemy", attack: 4, defence: 4, speed: 4, lootPoints: 4, description: "A weak enemy" },
	strongEnemy: { name: "Strong Enemy", attack: 6, defence: 6, speed: 6, lootPoints: 6, description: "A strong enemy" },
	caringEnemy: { name: "Caring Enemy", attack: 0, defence: 0, speed: 0, lootPoints: -5, description: "A poor, weak, defenceless enemy" }
}
const plainTileDeck = [
	{ type: "doNothing", deckWeight: 1 }
]
const bushTileDeck = [
	{ type: "doNothing", deckWeight: 1 }
]
const pondTileDeck = [
	{ type: "doNothing", deckWeight: 1 }
]
const treasureTileDeck = [
	{ type: "doNothing", deckWeight: 1 }
]
const mysteryTileDeck = [
	{ type: "doNothing", deckWeight: 9 },
	{ type: "enemy", enemy: enemyBuildData.strongEnemy, deckWeight: 1 }
]
const enemyTileDeck = [
	{ type: "enemy", enemy: enemyBuildData.normalEnemy, deckWeight: 6 },
	{ type: "enemy", enemy: enemyBuildData.stabbyEnemy, deckWeight: 2 },
	{ type: "enemy", enemy: enemyBuildData.tankyEnemy, deckWeight: 2 },
	{ type: "enemy", enemy: enemyBuildData.fastEnemy, deckWeight: 2 },
	{ type: "enemy", enemy: enemyBuildData.weakEnemy, deckWeight: 2 },
	{ type: "enemy", enemy: enemyBuildData.strongEnemy, deckWeight: 2 },
	{ type: "enemy", enemy: enemyBuildData.caringEnemy, deckWeight: 1 }
]
const tileDeck = [
	{ toString: () => "Plain Tile", deckWeight: 6, imgSource: "./mapTiles/baseTile.png", deck: plainTileDeck },
	{ toString: () => "Bush Tile", deckWeight: 2, imgSource: "./mapTiles/bushTile.png", deck: bushTileDeck },
	{ toString: () => "Pond Tile", deckWeight: 2, imgSource: "./mapTiles/pondTile.png", deck: pondTileDeck },
	{ toString: () => "Treasure Tile", deckWeight: 0, imgSource: "./mapTiles/treasureTile.png", deck: treasureTileDeck },
	{ toString: () => "Mystery Tile", deckWeight: 2, imgSource: "./mapTiles/mysteryTile.png", deck: mysteryTileDeck },
	{ toString: () => "Enemy Tile", deckWeight: 2, imgSource: "./mapTiles/enemyTile.png", deck: enemyTileDeck }
]
let nonDistanceDiceRoll = false
let nearbyCells = []


// @note Draw a card
// -----------------------------------------------------------------------------------------------------
function cumulativeWeights(cardDeck) {
	const cumulativeWeights = [];
	cardDeck.forEach((card, i) => {
		cumulativeWeights[i] = card.deckWeight + (cumulativeWeights[i - 1] || 0);
	})
	return cumulativeWeights
}

function drawCard(cardDeck) {
	const weights = cumulativeWeights(cardDeck)
	const maxCumulativeWeight = weights[weights.length - 1];
	const randomNumber = maxCumulativeWeight * Math.random();

	for (let cardIndex = 0; cardIndex < cardDeck.length; cardIndex += 1) {
		if (weights[cardIndex] >= randomNumber) {
			return cardDeck[cardIndex]
		}
	}
	return cardDeck[0]
}


// @note Roll a die
// -----------------------------------------------------------------------------------------------------
function rollDice(minRoll, maxRoll) {
	return Math.floor(Math.random() * ((maxRoll - minRoll) + 1) + minRoll);
}

async function onRollDice() {
	if ((HTMLElements.rollDiceButton.getAttribute("disabled") === "false") && !nonDistanceDiceRoll) {
		let currentTile = document.querySelector('.dot.clicked')
		const roll = rollDice(1, 6)
		nearbyCells = cellsDistanceAway(currentTile.id, roll, true)
		await rollDiceShake(roll, true)
	}
}

function enemyRollDice() {
	return new Promise(async (resolve) => {
		nonDistanceDiceRoll = true
		const reenable = HTMLElements.rollDiceButton.getAttribute("disabled")
		const roll = rollDice(1, 6)

		const diceBG = HTMLElements.rollDiceBackground
		diceBG.style = "background-color: #74302e;"
		await rollDiceShake(roll, reenable)
		diceBG.style = "background-color: #1e1e1e;"

		nonDistanceDiceRoll = false
		resolve(roll)
	});
}

function playerRollDice() {
	return new Promise((resolve) => {
		nonDistanceDiceRoll = true
		const reenable = HTMLElements.rollDiceButton.getAttribute("disabled")
		HTMLElements.rollDiceButton.setAttribute("disabled", false)

		HTMLElements.rollDiceButton.addEventListener('click', async function (e) {
			const roll = rollDice(1, 6)
			await rollDiceShake(roll, reenable)
			nonDistanceDiceRoll = false
			resolve(roll)
		}, { once: true });
	});
}

async function rollDiceShake(roll, reenable) {
	const movesDisabled = HTMLElements.attackButton.disabled
	setMoveChoicesDisable(true)

	HTMLElements.rollDiceImage.src = `./dice/dice${roll}.png`
	HTMLElements.rollDiceImage.alt = `Dice roll of ${roll}`
	HTMLElements.rollDiceButton.setAttribute("disabled", true)

	HTMLElements.rollDiceBackground.classList.add('shake')
	await promiseTimeout(500)
	HTMLElements.rollDiceBackground.className = ''

	HTMLElements.rollDiceButton.setAttribute("disabled", reenable)

	setMoveChoicesDisable(movesDisabled)
	return new Promise((resolve) => { resolve() })
}


// @note Set a timeout that can be awaited
// -----------------------------------------------------------------------------------------------------
function promiseTimeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


// @note Generate the hex grid map
// -----------------------------------------------------------------------------------------------------
function hexGrid(edgeLength) {
	const cellYScale = 0.8660254037844387;
	const len = 2 * edgeLength - 1,
		vx = Math.sin(Math.PI / 6),
		vy = Math.cos(Math.PI / 6),
		tl = edgeLength - 1,
		br = 3 * edgeLength - 2,
		positions = []

	for (let y = 0; y < len; ++y) {
		for (let x = 0; x < len; ++x) {
			if (x + y < tl || x + y >= br) continue;

			const xPosition = Math.round((vx * y + x) * 2) - edgeLength + 1
			const yPosition = Math.round((vy * y) / cellYScale)

			if (yPosition < edge - 2) {
				positions.push({
					x: xPosition,
					y: yPosition
				})
			} else if (yPosition === edge - 1 || yPosition === edge - 2) {
				for (let j = 0; j < edge; ++j) {
					positions.push({
						x: xPosition,
						y: yPosition + (2 * j)
					})
				}
			} else {
				positions.push({
					x: xPosition,
					y: yPosition + (2 * (edge - 1))
				})
			}
		}
	}
	return positions;
}

function generateHexGridHTML() {
	cells.forEach((pos, id) => {
		const tileType = drawCard(tileDeck)

		//visualize the grid
		const node = document.createElement("img");
		node.className = "dot";
		node.src = tileType.imgSource;
		node.alt = tileType.toString()
		node.setAttribute("type", tileType.toString())
		const newId = id
		node.id = "dot" + newId
		node.setAttribute("x", pos.x)
		node.setAttribute("y", pos.y)

		//scale the values before applying
		node.style.top = (pos.y * cellSpacing) * 13 + 8 + "px";
		node.style.left = ((pos.x) * (1 + cellSpacing)) * 13 + 15 + "px";
		document.getElementById("map").appendChild(node);
	});
}


// @note Calculate distances on the map
// -----------------------------------------------------------------------------------------------------
function cellsOneAway(startID, filterIDs) {
	inRangeCells = []
	previouslyClicked = document.getElementById(startID)
	x = previouslyClicked.getAttribute("x")
	y = previouslyClicked.getAttribute("y")

	document.querySelectorAll(".dot").forEach(e => {
		correctX = Math.abs(e.getAttribute("x") - x) <= 1
		correctY = Math.abs(e.getAttribute("y") - y) <= 2
		if (correctX && correctY && e.id !== startID) {
			if (!filterIDs.includes(e.id)) {
				e.classList.add('near', 'dot')
				inRangeCells.push(e.id)
			}
		}
	})
	return inRangeCells
}

function increaseDistanceByOne(startingCells) {
	increasedDistance = startingCells
	startingCells.forEach(elementID => {
		increasedDistance = increasedDistance.concat(cellsOneAway(elementID, increasedDistance))
	});
	return increasedDistance
}

function cellsDistanceAway(startID, distance) {
	cellsInRange = cellsOneAway(startID, [startID]).concat([startID])
	for (let y = 1; y < distance; ++y) {
		cellsInRange = cellsInRange.concat(increaseDistanceByOne(cellsInRange))
	}
	return cellsInRange
}


// @note Player creation
// -----------------------------------------------------------------------------------------------------
function validNewPlayerStats(playerName, playerAttack, playerDefence, playerSpeed, mapTileType) {
	let isValid = true
	let check = true
	const playerData = [[playerSpeed, "Speed"], [playerDefence, "Defence"], [playerAttack, "Attack"], [playerName, "Player name"]]
	const playerStats = [[playerSpeed, "Speed"], [playerDefence, "Defence"], [playerAttack, "Attack"]]

	// Input values should not be blank
	playerData.forEach(element => {
		check = !(!element[0] || !element[0].trim())
		checkIfValid(check, `${element[1]} should not be blank`)
		isValid = isValid && check
	});
	if (!isValid) {
		return false
	}

	// Stats should be integers
	playerStats.forEach(element => {
		check = (parseFloat(element[0]) === Math.round(parseInt(element[0])))
		checkIfValid(check, `${element[1]} should be an integer`)
		isValid = isValid && check
	});
	if (!isValid) {
		return false
	}

	// Stats should add to 15
	check = (parseInt(playerAttack) + parseInt(playerDefence) + parseInt(playerSpeed) === 15);
	if (!check) {
		showMessage(`Player stats should sum to 15 total points`)
		return false
	}

	// Input values should not be less than one
	playerStats.forEach(element => {
		check = (parseInt(element[0]) > 0)
		checkIfValid(check, `${element[1]} cannot be less than 1`)
		isValid = isValid && check
	});
	if (!isValid) {
		return false
	}

	// Map tile should be blank
	check = (mapTileType === tileDeck[0].toString());
	if (!check) {
		showMessage(`Starting position should be a blank tile`)
		return false
	}

	return true
}

function checkIfValid(validityCheck, messageIfInvalid) {
	if (!validityCheck) {
		// value is null or empty
		showMessage(messageIfInvalid)
	}
	return validityCheck
}


async function showMessage(message, timeout) {
	const oldSnackbar = document.getElementById("snackbar");
	if (oldSnackbar) {
		oldSnackbar.remove()
	}
	const newSnackbar = document.createElement("div")
	document.body.appendChild(newSnackbar);
	newSnackbar.id = "snackbar"

	newSnackbar.innerHTML = message
	newSnackbar.className = "show";
	setTimeout(function () { newSnackbar.className = newSnackbar.className.replace("show", "hide"); }, 3000);
	setTimeout(function () { newSnackbar.remove() }, 3400);

}

class Player {
	constructor(name, attack, defence, speed, position) {
		this.name = name;
		this.base = { attack: attack, defence: defence, speed: speed, health: 5 };
		this.modifier = { attack: 0, defence: 0, speed: 0, health: 0 };
		this.gold = 0;
		this.lootPoints = 0;
		this.wins = 0;
		this.inventory = [];
		this.position = position;
		this.moveChoice
	}
	toString() { return this.name }
	modifyAttack(modifyBy) { this.modifier.attack += modifyBy }
	get attack() {
		return this.base.attack + this.modifier.attack;
	}
	modifyDefence(modifyBy) {
		this.modifier.defence += modifyBy
		if (this.defence <= 0) {
			this.modifier.defence = 0
			this.modifyHealth(-1)
		}
	}
	get defence() {
		return this.base.defence + this.modifier.defence;
	}
	modifySpeed(modifyBy) { this.modifier.speed += modifyBy }
	get speed() {
		return this.base.speed + this.modifier.speed;
	}
	modifyHealth(modifyBy) { this.modifier.health += modifyBy }
	get health() {
		return this.base.health + this.modifier.health;
	}
	addWin() { this.wins += 1 }
	addLoot(opponentPoints) { this.lootPoints += opponentPoints }
	resetChoice() {
		this.moveChoice = choicePromiseGenerator()
	}
}

function addNewPlayer(name, attack, defence, speed, position) {
	Players.push(
		new Player(name, attack, defence, speed, position)
	)
}

function choicePromiseGenerator() {
	return new Promise((resolve) => {
		for (const choiceButton of document.querySelectorAll(".choiceSelector")) {
			choiceButton.addEventListener('click', function (e) {
				/// do something to process the answer
				switch (choiceButton.textContent.trim()) {
					case "Attack":
						resolve(attackOpponent);
						break
					case "Escape":
						resolve(flee);
						break
					case "Use Item":
						resolve("not yet implemented");
						break
					default:
						resolve("something went wrong")
				}
			}, { once: true });
		}
	});
}


// @note Enemy creation
// -----------------------------------------------------------------------------------------------------
function addNewEnemy(buildData, position) {
	newEnemy = new Enemy(buildData.name, buildData.attack, buildData.defence, buildData.speed, position, buildData.lootPoints, buildData.description)
	Enemies.push(newEnemy)
	return newEnemy
}

class Enemy {
	constructor(name, attack, defence, speed, position, lootPoints, description) {
		this.name = name;
		this.base = { attack: attack, defence: defence, speed: speed, health: 1 };
		this.modifier = { attack: 0, defence: 0, speed: 0, health: 0 };
		this.gold = 0;
		this.lootPoints = lootPoints;
		this.wins = 0;
		this.inventory = [];
		this.position = position;
		this.description = description;
		this.moveChoice = attackOpponent;
	}
	toString() { return this.name }
	modifyAttack(modifyBy) { this.modifier.attack += modifyBy }
	get attack() {
		return this.base.attack + this.modifier.attack;
	} modifyDefence(modifyBy) {
		this.modifier.defence += modifyBy
		if (this.defence <= 0) {
			this.modifier.defence = 0
			this.modifyHealth(-1)
		}
	}
	get defence() {
		return this.base.defence + this.modifier.defence;
	}
	modifySpeed(modifyBy) { this.modifier.speed += modifyBy }
	get speed() {
		return this.base.speed + this.modifier.speed;
	}
	modifyHealth(modifyBy) { this.modifier.health += modifyBy }
	get health() {
		return this.base.health + this.modifier.health;
	}
	addWin() { this.wins += 1 }
	addLoot(opponentPoints) { this.lootPoints += opponentPoints }
}


// @note Battle moves
// -----------------------------------------------------------------------------------------------------
function findRoundTurns(entitiesArray) {
	sorted = entitiesArray.sort((a, b) => -a.base.speed - a.modifier.speed + b.base.speed + b.modifier.speed)
	return sorted
}

async function attackOpponent(attacker, defender, rollValue) {
	let defenderDefeated
	let damage = attacker.attack + rollValue
	if (damage < 0) {
		damage = 0
	}
	defender.modifyDefence(-damage)
	if (defender.health <= 0) {
		attacker.addWin()
		attacker.lootPoints += defender.lootPoints
		let index = Enemies.indexOf(defender);
		if (index > -1) {
			Enemies.splice(index, 1);
		}
		showMessage(`${attacker.name} defeated ${defender.name}`)
		defenderDefeated = true
	} else {
		showMessage(`${attacker.name} did ${damage} damage to ${defender.name}`)
		defenderDefeated = false
	}
	return defenderDefeated
}

async function flee(escapee, chaser, rollValue) {
	let fleeSucessful
	const escapeVelocity = escapee.speed + rollValue
	if (escapeVelocity >= chaser.speed) {
		showMessage(`${escapee.name} escaped from ${chaser.name}`)
		fleeSucessful = true
	} else {
		await showMessage(`${escapee.name} did not manage to get away`)
		fleeSucessful = false
	}
	return fleeSucessful
}


// @note Map Tile Functions
function onTileDrawCard(position, tileDeck) {
	const nearbyEnemies = getNearbyEntities(Players[0])
	if (nearbyEnemies.length !== 0) {
		encounterEnemy()
	} else {
		const card = drawCard(tileDeck)
		switch (card.type) {
			case "doNothing":
				doNothing()
				break
			case "enemy":
				enemy = addNewEnemy(card.enemy, position)
				encounterEnemy()
				break
			default:
				console.log("something went wrong")
		}
	}
}

function getNearbyEntities(entity) {
	const allEntities = Players.concat(Enemies)
	return allEntities.filter((otherEntity, index) => {
		return (otherEntity.position.toString() === entity.position.toString()) &&
			(index !== allEntities.indexOf(entity))
	})
}

function doNothing() {
	HTMLElements.rollDiceButton.setAttribute("disabled", false)
}

async function encounterEnemy() {
	const nearbyEnemies = getNearbyEntities(Players[0])
	const enemy = nearbyEnemies[0]
	updateEnemyCard(enemy)

	let leaveTile
	do {
		leaveTile = await playRound()
	} while (!leaveTile)

	leaveTileUpdate()
}

async function playRound() {
	const nearbyEnemies = getNearbyEntities(Players[0])
	const turnOrder = findRoundTurns(nearbyEnemies.concat([Players[0]]))

	// create an array of entity moves
	let moves = []
	setMoveChoicesDisable(false)
	await turnOrder.forEach(async (entity, index) => {
		moves.push(entity.moveChoice)
	})
	moves = await Promise.all(moves)
	setMoveChoicesDisable(true)

	let success = false

	for (const entity of turnOrder) {
		if (entity.health > 0) {
			const index = turnOrder.indexOf(entity)
			const possibleOpponents = turnOrder.filter(opponent => { return turnOrder.indexOf(opponent) !== index })
			const opponent = possibleOpponents[rollDice(0, possibleOpponents.length - 1)]

			choice = moves[index]
			let roll
			if (entity instanceof Player) {
				roll = await playerRollDice()
			} else {
				roll = await enemyRollDice()
			}
			choiceResult = await choice(entity, opponent, roll - 3)
			success = success || choiceResult
			await updateAllEntityCards(Players[0], nearbyEnemies[0], turnOrder)
			if (choice = flee && success) {
				break
			}
		}
	}

	return new Promise((resolve) => { resolve(success) })
}

function leaveTileUpdate() {
	// Hide enemy card and reenable dice roll after leaving the tile
	HTMLElements.fullCard.className = HTMLElements.fullCard.className.replace("show", "hide");
	setTimeout(function () { HTMLElements.fullCard.className = HTMLElements.fullCard.className.replace("hide", ""); }, 400);
	HTMLElements.fullCard.className = HTMLElements.fullCard.className.replace("shake", "");
	if (Players[0].health > 0) {
		HTMLElements.rollDiceButton.setAttribute("disabled", false)
	} else {
		alert(`Game Over\nYou defeated ${Players[0].wins} enemies with a score of ${Players[0].lootPoints}!\n`)
	}
	HTMLElements.attackButton.disabled = true
	HTMLElements.fleeButton.disabled = true
	updateMap()
}


// @note Update HTML
// -----------------------------------------------------------------------------------------------------
function updatePlayerCard(player) {
	HTMLElements.playerName.value = player.name
	HTMLElements.playerHealth.value = player.health
	HTMLElements.playerAttack.value = player.attack
	HTMLElements.playerDefence.value = player.defence
	HTMLElements.playerSpeed.value = player.speed
}

function updatePlayerCardTryShake(player) {
	shakeOnChange(HTMLElements.playerHealth, player.health, false)
	shakeOnChange(HTMLElements.playerDefence, player.defence, playerHealth <= 0)
	updatePlayerCard(player)
	return promiseTimeout(500)
}

function updateEnemyCard(enemy) {
	HTMLElements.fullCardName.value = enemy.name
	HTMLElements.fullCardDescription.innerHTML = enemy.description
	HTMLElements.enemyHealth.value = enemy.health
	HTMLElements.enemyAttack.value = enemy.attack
	HTMLElements.enemyDefence.value = enemy.defence
	HTMLElements.enemySpeed.value = enemy.speed
	HTMLElements.enemyLoot.value = enemy.lootPoints
	HTMLElements.fullCard.classList.add('show');
}

function updateEnemyCardTryShake(enemy) {
	shakeOnChange(HTMLElements.enemyHealth, enemy.health, false)
	const enemyDead = enemy.health <= 0
	shakeOnChange(HTMLElements.enemyDefence, enemy.defence, enemyDead)
	if (enemyDead) {
		HTMLElements.fullCard.className = HTMLElements.fullCard.className.replace("show", "shake")
	}
	updateEnemyCard(enemy)
	return promiseTimeout(500)
}

function shakeOnChange(element, newValue, ignore) {
	if (parseInt(element.value) !== newValue && !ignore) {
		if (newValue) {
			element.value = newValue
		} else {
			element.value = 0
		}
		element.classList.add('shake');
		setTimeout(function () { element.className = element.className.replace("shake", ""); }, 500);
	} else {
		element.value = newValue
	}
}

async function updateAllEntityCards(player, enemy, turnOrder) {
	Players.forEach(player => { player.resetChoice() }
	)

	if (turnOrder.indexOf(player) !== 0) {
		await updatePlayerCardTryShake(player)
		if (enemy) {
			await updateEnemyCardTryShake(enemy);
		}
	} else {
		if (enemy) {
			await updateEnemyCardTryShake(enemy)
		}
		await updatePlayerCardTryShake(player);
	}

	return new Promise((resolve) => { resolve() })
}

function setMoveChoicesDisable(disable) {
	HTMLElements.attackButton.disabled = disable
	HTMLElements.fleeButton.disabled = disable
}

function updateMap() {
	for (const mapTile of document.querySelectorAll(".dot")) {
		mapTile.className.replace("hasEnemy", "")

		const x = mapTile.getAttribute("x")
		const y = mapTile.getAttribute("y")

		Enemies.forEach(enemy => {
			if (enemy.position[0] === parseInt(x) && enemy.position[1] === parseInt(y)) {
				mapTile.classList.add("hasEnemy")
			}
		});
	}
}


// @note Page Loaded (game start)
// -----------------------------------------------------------------------------------------------------
function load() {
	generateHexGridHTML()
	HTMLElements.rollDiceButton = document.querySelector('#diceButton');
	HTMLElements.rollDiceImage = document.querySelector('#diceImg');
	HTMLElements.rollDiceBackground = document.querySelector("#diceBackground")
	HTMLElements.playerName = document.querySelector('#playerName')
	HTMLElements.playerHealth = document.querySelector('#playerHealth')
	HTMLElements.playerAttack = document.querySelector('#playerAttack')
	HTMLElements.playerDefence = document.querySelector('#playerDefence')
	HTMLElements.playerSpeed = document.querySelector('#playerSpeed')
	HTMLElements.fullCard = document.querySelector('#fullCard');
	HTMLElements.fullCardName = document.querySelector('#fullCardName')
	HTMLElements.fullCardDescription = document.querySelector('#fullCardDescription')
	HTMLElements.enemyHealth = document.querySelector('#enemyHealth')
	HTMLElements.enemyAttack = document.querySelector('#enemyAttack')
	HTMLElements.enemyDefence = document.querySelector('#enemyDefence')
	HTMLElements.enemySpeed = document.querySelector('#enemySpeed')
	HTMLElements.enemyLoot = document.querySelector('#enemyLoot')
	HTMLElements.attackButton = document.querySelector('#attackButton')
	HTMLElements.fleeButton = document.querySelector('#fleeButton')
	alert("Input your name, your starting stats (you have 15 point to assign however you want) and then click a blank tile to start!")
	const helper = document.querySelector("#statHelper")

	for (const mapTile of document.querySelectorAll(".dot")) {
		mapTile.addEventListener('click', onMapClick)
	}
	function onMapClick() {
		previouslyClicked = document.querySelector(".clicked")
		tileIsNear = nearbyCells.includes(this.id)

		if (previouslyClicked && (!tileIsNear || (this.id === previouslyClicked.id)) ) {
			return undefined
		} else if (tileIsNear) {
			// update player position
			const card = drawCard(tileDeck);
			previouslyClicked.src = card.imgSource
			previouslyClicked.alt = card.toString()
			previouslyClicked.setAttribute("type", card.toString())
			previouslyClicked.className = "dot"
			document.querySelectorAll(".near").forEach(e => {
				e.className = "dot"
			})
			Players[0].position = [parseInt(this.getAttribute("x")), parseInt(this.getAttribute("y"))]
		} else if (!validNewPlayerStats(document.querySelector('#playerName').value,
			document.querySelector('#playerAttack').value,
			document.querySelector('#playerDefence').value,
			document.querySelector('#playerSpeed').value,
			this.getAttribute("type"))) { 
				return undefined; 
		} else {
			// add new player if the stats are valid
			[playerName, playerAttack, playerDefence, playerSpeed].forEach(element => {
				element.readOnly = true;
			});
			addNewPlayer(playerName.value, parseInt(playerAttack.value), parseInt(playerDefence.value), parseInt(playerSpeed.value), [parseInt(this.getAttribute("x")), parseInt(this.getAttribute("y"))])
			helper.style = "visibility: hidden"
			for (const stats of document.querySelectorAll("#playerCard .wideStatbox input")) {
				stats.type = "text"
			}
			Players.forEach(player => { player.resetChoice() })
		}
	const tileType = this.getAttribute("type")
	const mapTile = tileDeck.find(obj => {
		return obj.toString() === tileType
	})
	onTileDrawCard([parseInt(this.getAttribute("x")), parseInt(this.getAttribute("y"))], mapTile.deck)
	document.getElementById(this.id).classList.add('clicked', 'dot')
	updateMap()
}

HTMLElements.rollDiceButton.addEventListener('click', onRollDice)

for (const stats of document.querySelectorAll("#playerCard .wideStatbox:not(:first-child")) {
	stats.addEventListener("input", onFormUpdate)
	stats.addEventListener("keypress", function (evt) {
		// Prevents typing 'e' and other funny business
		// 0 for null values
		// 8 for backspace 
		// 48-57 for 0-9 numbers
		if (evt.which != 8 && evt.which != 0 && evt.which < 48 || evt.which > 57) {
			evt.preventDefault();
		}
	})
}

function onFormUpdate() {
	const pointsLeft = 15 - (parseFloat(HTMLElements.playerAttack.value) | 0) - (parseFloat(HTMLElements.playerDefence.value) | 0) - (parseFloat(HTMLElements.playerSpeed.value) | 0)
	helper.innerHTML = `You have ${pointsLeft} <br> stat points left <br> to assign`
}

}

module.exports = { tileDeck, cumulativeWeights, drawCard, rollDice, promiseTimeout, validNewPlayerStats, Player, Enemy, addNewPlayer, Players, enemyBuildData, addNewEnemy, Enemies,
	findRoundTurns, attackOpponent, flee, getNearbyEntities };
const { tileDeck, cumulativeWeights, drawCard, rollDice, validNewPlayerStats, findRoundTurns, addNewPlayer, Players, attackOpponent, Enemy, Player, flee, addNewEnemy, enemyBuildData, Enemies, promiseTimeout, getNearbyEntities } = require('./index');

describe("tileDeck cards are valid", () => {
    tileDeck.forEach(tileType => {
        describe(`${tileType}`, () => {
            test('can print its name', () => {
                expect(tileType.toString() !== undefined).toBe(true)
            })
            test('has a non-negative deck weight', () => {
                expect(tileType.deckWeight >= 0).toBe(true)
            })
            test('has an image', () => {
                expect(tileType.imgSource).toBeTruthy()
            })
            test('has an associated deck', () => {
                expect(tileType.deck).toBeTruthy()
            })
        })
    })
})


describe(`rollDice`, () => {
    for (let i = 0; i < 6; ++i) {
        test(`die can roll a ${i + 1}`, () => {
            Math.random = () => { return (i / 6) }
            expect(rollDice(1, 6)).toBe(i + 1)
        })
    }
})


describe(cumulativeWeights, () => {
    test(`first value is the deckWeight of only the first card`, () => {
        expect(cumulativeWeights(tileDeck)[0]).toBe(tileDeck[0].deckWeight)
    })
    test(`last value is sum of all deckWeights`, () => {
        let sum = 0
        tileDeck.forEach(tileType => {
            sum += tileType.deckWeight
        })
        expect(cumulativeWeights(tileDeck)[tileDeck.length - 1]).toBe(sum)
    })
})

describe(drawCard, () => {
    test(`all cards with non-zero deckWeight in a deck can can be drawn`, () => {
        let test = true

        tileDeck.forEach((tileType, i) => {
            let weights = cumulativeWeights(tileDeck)
            const maxCumulativeWeight = weights[weights.length - 1];

            Math.random = () => weights[i] / maxCumulativeWeight
            if (tileType.deckWeight !== 0 && drawCard(tileDeck).toString() !== tileType.toString()) {
                test = false
            }
        })

        expect(test).toBe(true)
    })
})


describe(promiseTimeout, () => {
    test(`returns a promise`, () => {
        expect(promiseTimeout(0) instanceof Promise).toBe(true)
    })
})


describe(validNewPlayerStats, () => {
    test('valid stats are accepted', () => {
        expect(validNewPlayerStats("name", '5', '5', '5', tileDeck[0].toString())).toBe(true)
    })
    test('blank values are rejected', () => {
        expect(validNewPlayerStats(" ", '5', '5', '5', tileDeck[0].toString())).toBe(false)
    })
    test('decimal value stats are rejected', () => {
        expect(validNewPlayerStats("name", '4.5', '5.5', '5', tileDeck[0].toString())).toBe(false)
    })
    test('stat values not adding to 15 are rejected', () => {
        expect(validNewPlayerStats("name", '6', '5', '5', tileDeck[0].toString())).toBe(false)
    })
    test('stat values less than 1 are rejected', () => {
        expect(validNewPlayerStats("name", '0', '10', '5', tileDeck[0].toString())).toBe(false)
    })
    test('non-plain starting tiles are rejected', () => {
        expect(validNewPlayerStats("name", '5', '5', '5', tileDeck[1].toString())).toBe(false)
    })
})

describe(addNewPlayer, () => {
    addNewPlayer("Player", 3, 4, 5, [0, 1])
    test('name is added', () => {
        expect(Players[0].toString()).toEqual("Player")
    })
    test('attack is added', () => {
        expect(Players[0].base.attack).toEqual(3)
    })
    test('defence is added', () => {
        expect(Players[0].base.defence).toEqual(4)
    })
    test('speed is added', () => {
        expect(Players[0].base.speed).toEqual(5)
    })
    test('position is added', () => {
        expect(Players[0].position).toEqual([0, 1])
    })
})

describe(Player, () => {
    const player = new Player("Player", 5, 5, 5, [0, 1])
    test("player has a name", () => {
        expect(player.toString()).toBe("Player")
    })
    test("player attack can be modified", () => {
        player.modifyAttack(3)
        expect(player.modifier.attack).toBe(3)
        expect(player.attack).toBe(8)
    })
    test("player defence can be modified", () => {
        player.modifyDefence(3)
        expect(player.modifier.defence).toBe(3)
        expect(player.defence).toBe(8)
    })
    test("modifying player defence below the base value resets the modifier to 0", () => {
        player.modifier.defence = 0
        player.modifyDefence(-10)
        expect(player.modifier.defence).toBe(0)
    })
    test("modifying player defence can reduce health", () => {
        player.modifier.defence = 0
        player.modifier.health = 0
        player.modifyDefence(-10)
        expect(player.health).toBe(4)
    })
    test("player speed can be modified", () => {
        player.modifySpeed(3)
        expect(player.modifier.speed).toBe(3)
        expect(player.speed).toBe(8)
    })
    test("player health can be modified", () => {
        player.modifier.health = 0
        player.modifyHealth(3)
        expect(player.modifier.health).toBe(3)
        expect(player.health).toBe(8)
    })
    test("player win can be added", () => {
        player.addWin()
        expect(player.wins).toBe(1)
    })
    test("player loot can be added", () => {
        player.addLoot(10)
        expect(player.lootPoints).toBe(10)
    })
    test("resetChoice sets player moveChoice to be a promise", () => {
        player.resetChoice()
        expect(player.moveChoice instanceof Promise).toBe(true)
    })
})


describe("enemyBuildData are valid", () => {
    for (const [key, value] of Object.entries(enemyBuildData)) {
        describe(`${value.name}`, () => {
            test('has a name', () => {
                expect(value.name !== undefined).toBe(true)
            })
            test('has an attack stat', () => {
                expect(value.attack !== undefined).toBe(true)
            })
            test('has a defence stat', () => {
                expect(value.defence !== undefined).toBe(true)
            })
            test('has a speed stat', () => {
                expect(value.speed !== undefined).toBe(true)
            })
            test('has a loot stat', () => {
                expect(value.lootPoints !== undefined).toBe(true)
            })
            test('has a description', () => {
                expect(value.description !== undefined).toBe(true)
            })
        })
    }
})

describe(addNewEnemy, () => {
    addNewEnemy({ name: "Test Enemy", attack: 3, defence: 4, speed: 5, lootPoints: 6, description: "An enemy used to test things" }, [0, 1])
    test('name is added', () => {
        expect(Enemies[0].toString()).toEqual("Test Enemy")
    })
    test('attack is added', () => {
        expect(Enemies[0].base.attack).toEqual(3)
    })
    test('defence is added', () => {
        expect(Enemies[0].base.defence).toEqual(4)
    })
    test('speed is added', () => {
        expect(Enemies[0].base.speed).toEqual(5)
    })
    test('loot is added', () => {
        expect(Enemies[0].lootPoints).toEqual(6)
    })
    test('description is added', () => {
        expect(Enemies[0].description).toEqual("An enemy used to test things")
    })
    test('position is added', () => {
        expect(Enemies[0].position).toEqual([0, 1])
    })
})

describe(Enemy, () => {
    const enemy = new Enemy("Enemy", 5, 5, 5, [0, 1], 5, "A description")
    test("enemy has a name", () => {
        expect(enemy.toString()).toBe("Enemy")
    })
    test("enemy attack can be modified", () => {
        enemy.modifyAttack(3)
        expect(enemy.modifier.attack).toBe(3)
        expect(enemy.attack).toBe(8)
    })
    test("enemy defence can be modified", () => {
        enemy.modifyDefence(3)
        expect(enemy.modifier.defence).toBe(3)
        expect(enemy.defence).toBe(8)
    })
    test("modifying enemy defence below the base value resets the modifier to 0", () => {
        enemy.modifier.defence = 0
        enemy.modifyDefence(-10)
        expect(enemy.modifier.defence).toBe(0)
    })
    test("modifying enemy defence can reduce health", () => {
        enemy.modifier.defence = 0
        enemy.modifier.health = 0
        enemy.modifyDefence(-10)
        expect(enemy.health).toBe(0)
    })
    test("enemy speed can be modified", () => {
        enemy.modifySpeed(3)
        expect(enemy.modifier.speed).toBe(3)
        expect(enemy.speed).toBe(8)
    })
    test("enemy health can be modified", () => {
        enemy.modifier.health = 0
        enemy.modifyHealth(3)
        expect(enemy.modifier.health).toBe(3)
        expect(enemy.health).toBe(4)
    })
    test("enemy win can be added", () => {
        enemy.addWin()
        expect(enemy.wins).toBe(1)
    })
    test("enemy loot can be added", () => {
        enemy.addLoot(5)
        expect(enemy.lootPoints).toBe(10)
    })
    test("enemy has a description", () => {
        expect(enemy.description).toBe("A description")
    })
})


describe(findRoundTurns, () => {
    test("array is returned in order of fastest to slowest speed", () => {
        const enemy = new Enemy("Enemy", 5, 5, 6, [0, 1], 5)
        const player = Players[0]
        expect(findRoundTurns([player, enemy])).toStrictEqual([enemy, player])
    })
    test("can handle multiple players and enemies", () => {
        const enemy1 = new Enemy("Enemy", 5, 5, 6, [0, 1], 5)
        const enemy2 = new Enemy("Enemy", 5, 5, 2, [0, 1], 5)
        const player1 = new Player("Player", 5, 5, 5, [0, 1])
        const player2 = new Player("Player", 5, 2, 8, [0, 1])
        expect(findRoundTurns([player1, enemy1, player2, enemy2])).toStrictEqual([player2, enemy1, player1, enemy2])
    })
})

describe(attackOpponent, () => {
    test("attacker can defeat opponent if they have high attack", async () => {
        const enemy = new Enemy("Enemy", 0, 1, 0, [0, 1], 5)
        const player = new Player("Player", 5, 0, 0, [0, 1])
        expect(await attackOpponent(player, enemy, 0)).toBe(true)
    })
    test("attacker can defeat opponent if they have a high roll", async () => {
        const enemy = new Enemy("Enemy", 0, 5, 0, [0, 1], 5)
        const player = new Player("Player", 1, 0, 0, [0, 1])
        expect(await attackOpponent(player, enemy, 6)).toBe(true)
    })
    test("attacker gains the opponent's loot points when they win", async () => {
        const enemy = new Enemy("Enemy", 0, 1, 0, [0, 1], 5)
        const player = new Player("Player", 5, 0, 0, [0, 1])
        await attackOpponent(player, enemy, 0)
        expect(player.lootPoints).toBe(enemy.lootPoints)
    })
    test("attacker gains a win when they defeat an opponent", async () => {
        const enemy = new Enemy("Enemy", 0, 1, 0, [0, 1], 5)
        const player = new Player("Player", 5, 0, 0, [0, 1])
        await attackOpponent(player, enemy, 0)
        expect(player.wins).toBe(1)
    })

    test("defender can survive if they have high defence", async () => {
        const enemy = new Enemy("Enemy", 0, 5, 0, [0, 1], 5)
        const player = new Player("Player", 1, 0, 0, [0, 1])
        expect(await attackOpponent(player, enemy, 0)).toBe(false)
    })
    test("defender's defence is decreased after an attack", async () => {
        const enemy = new Enemy("Enemy", 0, 5, 0, [0, 1], 5)
        const player = new Player("Player", 1, 0, 0, [0, 1])
        await attackOpponent(player, enemy, 1)
        expect(enemy.defence).toBe(3)
    })
})

describe(flee, () => {
    test("player can flee opponent if they have high speed", async () => {
        const enemy = new Enemy("Enemy", 0, 0, 1, [0, 1], 5)
        const player = new Player("Player", 0, 0, 5, [0, 1])
        expect(await flee(player, enemy, 0)).toBe(true)
    })
    test("flee attempt can fail if the opponent outruns the player", async () => {
        const enemy = new Enemy("Enemy", 0, 0, 5, [0, 1], 5)
        const player = new Player("Player", 0, 0, 1, [0, 1])
        expect(await flee(player, enemy, 0)).toBe(false)
    })
    test("player can flee opponent if they have a high roll", async () => {
        const enemy = new Enemy("Enemy", 0, 0, 5, [0, 1], 5)
        const player = new Player("Player", 0, 0, 1, [0, 1])
        expect(await flee(player, enemy, 6)).toBe(true)
    })
})

describe(getNearbyEntities, () => {
    const player = new Player("Player", 0, 0, 1, [0, 1])
    const enemy1 = new Enemy("Enemy", 0, 0, 5, [0, 1], 5)
    const enemy2 = new Enemy("Enemy", 0, 0, 5, [1, 1], 5)
    Enemies.push(enemy1, enemy2)
    test("returned array includes a nearby entity", () => {
        expect(getNearbyEntities(player).includes(enemy1)).toBe(true)
    })
    test("returned array does not include a far off entity", () => {
        expect(getNearbyEntities(player).includes(enemy2)).toBe(false)
    })
    test("returned array does not include the current entity", () => {
        expect(getNearbyEntities(player).includes(player)).toBe(false)
    })
})
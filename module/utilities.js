export class CharacterRandom {
    constructor(character) {
        this.character = character;
        let seed = this.character.data.data.seed;
        if (seed === null) {
            seed = new MersenneTwister().int()
            this.character.update({ "data.seed": seed });
        }
        this.engine = new MersenneTwister(seed);
    }

    randInt(min, max) {
        if (min === undefined) {
            return this.engine.int();
        }
        else if (max === undefined) {
            max = min;
            min = 0;
        }

        return Math.floor(this.engine.random() * (max - min)) + min;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.randInt(i + 1);
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
    }

    randSelect(array) {
        return array[this.randInt(array.length)];
    }

    random() {
        return this.engine.random();
    }

    async finish() {
        await this.character.update({ "data.seed": this.engine.int() });
    }
}

export function randSelect(array) {
    return array[randInt(array.length)];
}

export function randInt(max) {
    return Math.floor(Math.random() * max);
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randInt(i + 1);
        const tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
}

export function getAbility(folderName, abilityName) {
    let folder = game.folders.find(f => f.name == folderName && f.type == "Item");
    if (!folder) return null;

    for (const item of folder.contents) {
        if (item.name == abilityName) {
            return item;
        }
    }

    return null;
}

export function getAbilities(folderName) {
    let folder = game.folders.find(f => f.name == folderName && f.type == "Item");
    if (!folder) return [];

    const abilities = [];
    for (const item of folder.contents) {
        abilities.push(item)
    }
    return abilities;
}

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

    for (const item of folder.content) {
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
    for (const item of folder.content) {
        abilities.push(item)
    }
    return abilities;
}

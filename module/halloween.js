import { LightbearerActor } from "./actor.js";
import { CharacterRandom, shuffle, getAbilities, getAbility } from "./utilities.js";

const attribute_modifiers = {
    // Classes
    "Assassin": { "agility": 5, "perception": 2, "charisma": -2, "endurance": -2, "power": -2 },
    "Bard": { "charisma": 5, "memory": 5, "perception": -2, "agility": -1, "endurance": -3, "power": -3 },
    "Berserker": { "power": 5, "endurance": 4, "agility": 3, "charisma": -5, "memory": -3, "perception": -3 },
    "Cleric": { "charisma": 4, "endurance": 3, "agility": -2, "perception": -2, "power": -2 },
    "Druid": { "memory": 4, "perception": 2, "charisma": -2, "agility": -1, "power": -1, "endurance": -1 },
    "Elementalist": { "memory": 5, "charisma": -1, "power": -1, "endurance": -1, "agility": -1 },
    "Guardian": { "endurance": 6, "charisma": 1, "agility": -1, "memory": -1, "perception": -2, "power": -2 },
    "Necromancer": { "memory": 6, "charisma": -5 },
    // Races
    "Aarakocra": { "agility": 3, "perception": 3, "endurance": -2, "memory": -2, "charisma": -1 },
    "Centaur": { "power": 2, "endurance": 4, "agility": -3, "perception": -2 },
    "Dragonborn": { "power": 4, "endurance": 2, "agility": -3, "memory": -1, "charisma": -1 },
    "Dwarf": { "endurance": 4, "agility": -2, "perception": -1 },
    "Elf": { "agility": 3, "perception": 2, "memory": 2, "power": -3, "endurance": -3 },
    "Gnome": { "memory": 6, "charisma": 4, "agility": 1, "power": -5, "endurance": -5 },
    "Goliath": { "endurance": 6, "power": 6, "memory": -4, "charisma": -4, "agility": -3 },
    "Halfling": { "agility": 2, "charisma": 2, "power": -2, "endurance": -1 },
    "Human": {},
    "Orc": { "power": 2, "agility": 2, "endurance": 2, "memory": -2, "perception": -2, "charisma": -1 },
    "Satyr": { "memory": 4, "agility": 2, "power": -2, "endurance": -2, "perception": -1 },
    "Tabaxi": { "agility": 6, "perception": 3, "power": -2, "endurance": -4, "memory": -2 },
    "Tiefling": { "power": 3, "memory": 3, "charisma": -4, "agility": -1 },
    "Triton": { "perception": 2, "agility": 2, "memory": 2, "power": -3, "endurance": -2 },
    "Warforged": { "power": 3, "endurance": 3, "memory": 3, "perception": -4, "charisma": -4 },
};

const skill_modifiers = {
    // Classes
    "Assassin": ["stealth", "melee"],
    "Bard": ["spellwork"],
    "Berserker": ["melee"],
    "Cleric": ["spellwork"],
    "Druid": ["spellwork", "tracking"],
    "Elementalist": ["spellwork"],
    "Guardian": ["melee"],
    "Necromancer": ["spellwork"],
    // Races
    "Aarakocra": ["tracking"],
    "Centaur": ["ranged"],
    "Dragonborn": ["melee"],
    "Dwarf": ["artifice"],
    "Elf": ["ranged"],
    "Gnome": ["spellwork"],
    "Goliath": ["melee"],
    "Halfling": ["stealth"],
    "Human": ["artifice"],
    "Orc": ["melee", "melee"],
    "Satyr": ["spellwork"],
    "Tabaxi": ["stealth"],
    "Tiefling": ["spellwork"],
    "Triton": ["tracking"],
    "Warforged": ["melee"],
};

const skill_levels = [
    "Untrained", "Novice", "Skilled",
    "Expert", "Master", "Legend"
]

const descriptions = {
    // Classes
    "Assassin": "Stealthy, melee, single-target damage dealer",
    "Bard": "Team-oriented with large AoE buffs and debuffs",
    "Berserker": "Frontline brute with risky abilities",
    "Cleric": "Healer and ranged support",
    "Druid": "Shapeshifting jack of all trades",
    "Elementalist": "High-damage ranged powerhouse",
    "Guardian": "Melee tank that keeps allies out of danger",
    "Necromancer": "Undead-summoning ranged support",
    // Races
    "Aarakocra": "Agile and capable of flight",
    "Centaur": "Fast and tough",
    "Dragonborn": "Scaled and breathes fire",
    "Dwarf": "Short and sturdy",
    "Elf": "Agile and perceptive",
    "Gnome": "Small and weak, but intelligent",
    "Goliath": "Massive and strong",
    "Halfling": "Small and unassuming",
    "Human": "Adaptable",
    "Orc": "Athletic and resilient",
    "Satyr": "Intelligent and energetic",
    "Tabaxi": "Nimble feline humanoid",
    "Tiefling": "Cunning half-demon",
    "Triton": "Amphibious with natural electricity",
    "Warforged": "Automaton created by war mages",
};

function halloweenDialog(data) {
    if (!data.width) data.width = 600;
    if (!data.buttons) data.buttons = {};
    if (!data.render) data.render = html => { };
    if (!data.close) data.close = html => { };
    const dialog = new Dialog(data, { width: data.width, height: data.height });
    dialog.render(true);
    return dialog;
}

// On /levelup, open level up dialog
export async function levelup(character) {
    const engine = new CharacterRandom(character);
    // Figure out new abilities and stat increases
    const data = {
        available_abilities: [],
        selected_ability: null,
        selected_stat: null,
        selected_hp_style: null,
        attributes: character.data.data.stats,
        increased_attributes: {},
        finished: false,
    };
    for (let [attribute, value] of Object.entries(data.attributes)) {
        if (value >= 24) {
            data.increased_attributes[attribute] = value + 1;
        }
        else {
            data.increased_attributes[attribute] = value + 2;
        }
    }
    for (let _class of character.data.data.classes.split('/')) {
        for (let ability of getAbilities(_class)) {
            if (ability.name.endsWith("+")) continue;
            if (character.items.find(item => item.name === ability.name)) continue;
            data.available_abilities.push({
                name: ability.name,
                source: _class,
                actionCost: ability.data.data.actionCost,
                cooldown: ability.data.data.cooldown,
                description: ability.data.data.description,
            });
        }
    }
    engine.shuffle(data.available_abilities);
    data.available_abilities = data.available_abilities.splice(0, 3);

    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/level-up.html",
        data
    );
    // Display html in dialog
    const dialog = halloweenDialog({
        title: `Level Up: ${character.name}`,
        content: templateContent,
        close: html => {
            if (!data.finished) {
                character.update({ "data.resources.level_up": true });
            }
        },
        render: html => {
            // Select an hp style
            html.on('click', '.hp-style', ev => {
                const card = $(ev.currentTarget);
                data.selected_hp_style = card.data("style");
                html.find(".selected.hp-style").removeClass("selected");
                card.toggleClass("selected");
            });
            // Select a stat to increase
            html.on('click', '.attribute', ev => {
                const card = $(ev.currentTarget);
                data.selected_stat = card.data("stat");
                html.find(".selected.attribute").removeClass("selected");
                card.toggleClass("selected");
            });
            // Select an ability
            html.on('click', '.abilities .ability', ev => {
                const card = $(ev.currentTarget);
                const ability = getAbility(card.data("source"), card.data("name"));
                if (card.hasClass("selected")) {
                    data.selected_ability = null;
                }
                else {
                    html.find(".selected.ability").removeClass("selected");
                    data.selected_ability = ability;
                }
                card.toggleClass("selected");
            });

            // Finish
            html.on('click', '.finish', async ev => {
                console.log("Data", data);
                if (!data.selected_hp_style) {
                    ui.notifications.error("You must select an HP increase style.");
                    return;
                }
                if (!data.selected_stat) {
                    ui.notifications.error("You must select a stat to increase.");
                    return;
                }
                if (!data.selected_ability) {
                    ui.notifications.error("You must select a new ability to learn.");
                    return;
                }
                // Increase stats
                const updates = {};
                let hp_increase = 5;
                if (data.selected_hp_style === "random") {
                    const roll = new Roll("2d4", {});
                    await roll.roll({ async: true });
                    hp_increase = roll.total;
                    ui.notifications.info(`You gain ${hp_increase} max health.`);
                }
                updates["data.health.max"] = character.data.data.health.max + hp_increase;
                updates["data.health.value"] = character.data.data.health.value + hp_increase;
                updates[`data.stats.${data.selected_stat}`] = data.increased_attributes[data.selected_stat];
                await character.update(updates);
                // Add new ability
                await character.createEmbeddedDocuments("Item", [
                    {
                        name: data.selected_ability.name,
                        type: "Ability",
                        data: data.selected_ability.data.data
                    }
                ]);
                // Iterate character seed
                await engine.finish();
                data.finished = true;
                // Close the dialog
                dialog.close();
            });
        },
    });
}

// On /awaken, create a halloween character
export function awakenCommand(_args) {
    // Send chat message
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer story">${game.user.name}'s character is beginning to awaken ...</div>`
    });

    // Generate awaken data
    const classes = [
        "Assassin", "Bard", "Berserker", "Cleric", "Druid",
        "Elementalist", "Guardian", "Necromancer",
    ];
    shuffle(classes);

    const races = [
        "Aarakocra", "Centaur", "Dragonborn",
        "Dwarf", "Elf", "Gnome", "Goliath",
        "Halfling", "Human", "Orc", "Satyr",
        "Tabaxi", "Tiefling", "Triton",
        "Warforged",
    ]
    shuffle(races);

    const data = {
        "available_heroes": [
            { "id": randomID(16), "class": classes.pop(), "race": races.pop() },
            { "id": randomID(16), "class": classes.pop(), "race": races.pop() },
            { "id": randomID(16), "class": classes.pop(), "race": races.pop() },
            { "id": randomID(16), "class": classes.pop(), "race": races.pop() },
            { "id": randomID(16), "class": classes.pop(), "race": races.pop() },
        ],
        "selected_heroes": {},
        "selected_physical": null,
        "selected_mental": null,
        "available_abilities": [],
        "selected_abilities": {},
    };

    for (let hero of data.available_heroes) {
        hero.race_description = descriptions[hero.race];
        hero.class_description = descriptions[hero.class];
        hero.attributes = {
            "agility": 13,
            "endurance": 13,
            "power": 13,
            "charisma": 13,
            "memory": 13,
            "perception": 13,
        };
        hero.skills = {
            "artifice": 0,
            "tracking": 0,
            "spellwork": 0,
            "melee": 0,
            "ranged": 0,
            "stealth": 0,
        };
        for (let [attribute, amount] of Object.entries(attribute_modifiers[hero.race])) {
            hero.attributes[attribute] += amount;
        }
        for (let [attribute, amount] of Object.entries(attribute_modifiers[hero.class])) {
            hero.attributes[attribute] += amount;
        }
        for (let skill of skill_modifiers[hero.race]) {
            hero.skills[skill] += 1;
        }
        for (let skill of skill_modifiers[hero.class]) {
            hero.skills[skill] += 2;
        }
        // Populate all race abilities
        hero.race_abilities = getAbilities(hero.race);
        // Populate and shuffle class abilities
        hero.class_abilities = getAbilities(hero.class).filter(a => !a.name.endsWith("+"));
        shuffle(hero.class_abilities);
    }

    // Spawn hero select dialog
    heroSelect(data);
}

async function heroSelect(data) {
    // Empty selected heroes
    data["selected_heroes"] = {};
    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/hero-select.html",
        data
    );
    // Display html in dialog
    const dialog = halloweenDialog({
        width: 900,
        height: 602,
        title: "Character Creation: Hero Selection",
        content: templateContent,
        render: html => {
            html.on('click', '.hero', ev => {
                const card = $(ev.currentTarget);
                const hero = data.available_heroes.find(h => h.id === card.data("id"));
                if (card.hasClass("selected")) {
                    delete data.selected_heroes[hero.id];
                }
                else {
                    if (Object.keys(data.selected_heroes).length >= 2) {
                        return;
                    }
                    data.selected_heroes[hero.id] = hero;
                }
                card.toggleClass("selected");
            });
            html.on('click', '.next', ev => {
                if (Object.keys(data.selected_heroes).length != 2) {
                    ui.notifications.error("You must select two heroes.");
                    return;
                }
                // Open the attribute-select
                attributeSelect(data);
                // Close the dialog
                dialog.close();
            });
        },
    });
}

async function attributeSelect(data) {
    data["selected_physical"] = null;
    data["selected_mental"] = null;
    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/attribute-select.html",
        data
    );
    // Display html in dialog
    const dialog = halloweenDialog({
        title: "Character Creation: Attribute Selection",
        content: templateContent,
        render: html => {
            html.on('click', '.hero .attributes', ev => {
                const card = $(ev.currentTarget);
                html.find(`.hero .${card.data("type")}.attributes`).removeClass("selected");
                card.addClass("selected");
                data[`selected_${card.data("type")}`] = data.selected_heroes[card.parent().data("id")];
            });
            html.on('click', '.next', ev => {
                if (!data.selected_mental || !data.selected_physical) {
                    ui.notifications.error("You must select attributes.");
                    return;
                }
                powerSelect(data);
                dialog.close();
            });
            html.on('click', '.previous', ev => {
                heroSelect(data);
                dialog.close();
            });
        },
    });
}

async function powerSelect(data) {
    // Get top three abilities from each selected class
    data.selected_abilities = {};
    data.available_abilities = [];
    for (let hero of Object.values(data.selected_heroes)) {
        for (let i = 0; i < 3; i++) {
            const ability = hero.class_abilities[i];
            data.available_abilities.push({
                name: ability.name,
                source: hero.class,
                actionCost: ability.data.data.actionCost,
                cooldown: ability.data.data.cooldown,
                description: ability.data.data.description,
            });
        }
    }
    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/power-select.html",
        data
    );
    // Display html in dialog
    const dialog = halloweenDialog({
        title: "Character Creation: Power Selection",
        content: templateContent,
        render: html => {
            html.on('click', '.abilities .ability', ev => {
                const card = $(ev.currentTarget);
                const ability = getAbility(card.data("source"), card.data("name"));
                if (card.hasClass("selected")) {
                    delete data.selected_abilities[ability.id];
                }
                else {
                    if (Object.keys(data.selected_abilities).length >= 3) {
                        return;
                    }
                    data.selected_abilities[ability.id] = ability;
                }
                card.toggleClass("selected");
            });
            html.on('click', '.finish', async ev => {
                // Make sure 3 abilities are selected
                if (Object.keys(data.selected_abilities).length != 3) {
                    ui.notifications.error("You must select three abilities.");
                    return;
                }
                ui.notifications.info("Creating your character ...");
                const heroes = Object.values(data.selected_heroes);
                const folder = game.folders.find(f => f.name === "Players" && f.type === "Actor");
                // Create an actor
                const actor = await LightbearerActor.create({
                    name: `${game.user.name}'s Character`,
                    type: "Character",
                    folder: folder,
                });
                // Add classes, races, attributes and skills
                const artifice_level = skill_levels[Math.max(...heroes.map(h => h.skills.artifice))];
                const tracking_level = skill_levels[Math.max(...heroes.map(h => h.skills.tracking))];
                const spellwork_level = skill_levels[Math.max(...heroes.map(h => h.skills.spellwork))];
                const melee_level = skill_levels[Math.max(...heroes.map(h => h.skills.melee))];
                const ranged_level = skill_levels[Math.max(...heroes.map(h => h.skills.ranged))];
                const stealth_level = skill_levels[Math.max(...heroes.map(h => h.skills.stealth))];
                await actor.update({
                    "data.gamemode": "halloween",
                    "data.classes": heroes.map(h => h.class).join("/"),
                    "data.races": heroes.map(h => h.race).join("/"),
                    // Attributes
                    "data.stats.agility": data.selected_physical.attributes.agility,
                    "data.stats.endurance": data.selected_physical.attributes.endurance,
                    "data.stats.power": data.selected_physical.attributes.power,
                    "data.stats.charisma": data.selected_mental.attributes.charisma,
                    "data.stats.memory": data.selected_mental.attributes.memory,
                    "data.stats.perception": data.selected_mental.attributes.perception,
                    // Skills
                    "data.skills.artifice.level": artifice_level,
                    "data.skills.tracking.level": tracking_level,
                    "data.skills.spellwork.level": spellwork_level,
                    "data.skills.melee.level": melee_level,
                    "data.skills.ranged.level": ranged_level,
                    "data.skills.stealth.level": stealth_level,
                });
                // Add race and class abilities
                const abilities = [];
                for (let hero of heroes) {
                    for (let ability of hero.race_abilities) {
                        abilities.push({
                            name: ability.name,
                            type: "Ability",
                            data: ability.data.data
                        });
                    }
                }
                for (let ability of Object.values(data.selected_abilities)) {
                    abilities.push({
                        name: ability.name,
                        type: "Ability",
                        data: ability.data.data
                    });
                }
                await actor.createEmbeddedDocuments("Item", abilities);
                // Set actor as selected character
                game.user.update({ "character": actor.id });
                // Close the dialog
                dialog.close();
            });
            html.on('click', '.previous', ev => {
                attributeSelect(data);
                dialog.close();
            });
        },
    });
}

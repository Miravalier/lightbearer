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
];

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

const weapons = {
    "Assassin": ["Dagger", "Shortsword", "Rapier", "Hand Crossbow"],
    "Bard": ["Rapier", "Scimitar", "Longbow"],
    "Berserker": ["Greataxe", "Greatclub", "Halberd", "Maul", "Javelin"],
    "Cleric": ["Club", "Light Hammer", "Mace", "Buckler"],
    "Druid": ["Quarterstaff", "Shortbow", "Sling"],
    "Elementalist": ["Battleaxe", "Spear", "Quarterstaff", "Crossbow"],
    "Guardian": ["Flail", "Handaxe", "Longsword", "Spear", "Shield"],
    "Necromancer": ["Dagger", "Longsword", "Whip"],
};

function halloweenDialog(data) {
    if (!data.width) data.width = 600;
    if (!data.buttons) data.buttons = {};
    if (!data.render) data.render = html => { };
    if (!data.close) data.close = html => { };
    const dialog = new Dialog(data, { width: data.width, height: data.height });
    dialog.render(true);
    return dialog;
};

// Open injury dialog
export async function injure(character) {
    const engine = new CharacterRandom(character);
    const data = {
        finished: false,
        injuries: [
            { id: "ability", description: "Lose a random ability." },
            { id: "mental", description: "Lose 1 point from each mental attribute." },
            { id: "reaction", description: "Lose a reaction point." },
            { id: "physical", description: "Lose 1 point from each physical attribute." },
            { id: "vulnerability", description: "Gain vulnerability to a random element." },
            { id: "health", description: "Lose 2d6 maximum health." }
        ]
    };
    engine.shuffle(data.injuries);
    data.injuries = data.injuries.splice(0, 2);

    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/injury.html",
        data
    );
    // Display html in dialog
    const dialog = halloweenDialog({
        title: `Injury: ${character.name}`,
        content: templateContent,
        close: html => {
            if (!data.finished) {
                character.update({ "data.resources.injury": true });
            }
        },
        render: html => {
            html.on("click", ".injury", async ev => {
                const card = $(ev.currentTarget);
                const injury = card.data("id");
                data.finished = true;
                dialog.close()

                if (injury == "ability") {
                    const ability = engine.randSelect(Array.from(character.items));
                    character.deleteEmbeddedDocuments("Item", [ability.id]);
                    game.lightbearer.story(`${character.name} has lost the "${ability.name}" ability.`);
                }
                else if (injury == "mental") {
                    character.update({
                        "data.stats.charisma": character.system.stats.charisma - 1,
                        "data.stats.memory": character.system.stats.memory - 1,
                        "data.stats.perception": character.system.stats.perception - 1,
                    });
                    game.lightbearer.story(`${character.name} has lost 1 from each mental attribute."`);
                }
                else if (injury == "reaction") {
                    character.update({
                        "data.reactions.max": character.system.reactions.max - 1,
                    });
                    game.lightbearer.story(`${character.name} has lost 1 reaction point."`);
                }
                else if (injury == "physical") {
                    character.update({
                        "data.stats.agility": character.system.stats.agility - 1,
                        "data.stats.endurance": character.system.stats.endurance - 1,
                        "data.stats.power": character.system.stats.power - 1,
                    });
                    game.lightbearer.story(`${character.name} has lost 1 from each physical attribute."`);
                }
                else if (injury == "vulnerability") {
                    const element = engine.randSelect([
                        "Physical", "Fire", "Ice", "Lightning",
                        "Necrotic", "Radiant", "Poison"
                    ]);
                    character.createEmbeddedDocuments("Item", [
                        {
                            name: `${element} Vulnerability`,
                            type: "Ability",
                            data: { actionCost: "passive", description: `Vulnerable to ${element}.` },
                        }
                    ]);
                    game.lightbearer.story(`${character.name} is now vulnerable to ${element} damage."`);
                }
                else if (injury == "health") {
                    const hp = engine.randInt(6) + engine.randInt(6) + 2;
                    character.update({
                        "data.health.value": character.system.health.value - hp,
                        "data.health.max": character.system.health.max - hp,
                    });
                    game.lightbearer.story(`${character.name} has lost ${hp} maximum health.`);
                }
                await engine.finish();
            });
        }
    });
}

// Open level up dialog
export async function levelup(character) {
    const engine = new CharacterRandom(character);
    // Figure out new abilities and stat increases
    const data = {
        available_abilities: [],
        selected_ability: null,
        selected_stat: null,
        selected_hp_style: null,
        attributes: character.system.stats,
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
    for (let ability of getAbilities(character.system.class)) {
        if (ability.name.endsWith("+")) continue;
        if (character.items.find(item => item.name === ability.name)) continue;
        data.available_abilities.push({
            name: ability.name,
            source: character.system.class,
            actionCost: ability.system.actionCost,
            cooldown: ability.system.cooldown,
            description: ability.system.description,
        });
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
                if (!data.selected_hp_style) {
                    ui.notifications.error("You must select an HP increase style.");
                    return;
                }
                if (!data.selected_stat) {
                    ui.notifications.error("You must select a stat to increase.");
                    return;
                }
                if (!data.selected_ability && data.available_abilities.length > 0) {
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
                updates["data.health.max"] = character.system.health.max + hp_increase;
                updates["data.health.value"] = character.system.health.value + hp_increase;
                updates[`data.stats.${data.selected_stat}`] = data.increased_attributes[data.selected_stat];
                await character.update(updates);
                // Add new ability
                if (data.selected_ability) {
                    await character.createEmbeddedDocuments("Item", [
                        {
                            name: data.selected_ability.name,
                            type: "Ability",
                            data: data.selected_ability.system
                        }
                    ]);
                }
                // Iterate character seed
                await engine.finish();
                data.finished = true;
                // Close the dialog
                dialog.close();
            });
        },
    });
}

// On /create, create a halloween character
export function createCommand(_args) {
    // Send chat message
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer story">${game.user.name} is creating their character!</div>`
    });

    const classes = [
        "Assassin", "Bard", "Berserker", "Cleric", "Druid",
        "Elementalist", "Guardian", "Necromancer",
    ];

    const races = [
        "Dwarf",
        "Elf",
        "Goliath",
        "Human",
        "Tabaxi",
    ];

    const data = {
        "available_races": [],
        "available_classes": [],
        "selected_race": "Human",
        "selected_class": null,
        "available_abilities": [],
        "selected_abilities": [],
    };

    for (let _class of classes) {
        data.available_classes.push({ name: _class, description: descriptions[_class] });
    }

    for (let race of races) {
        data.available_races.push({ name: race, description: descriptions[race] });
    }

    // Spawn hero select dialog
    character_creation_1(data);
}

function fill_class_details(html, data) {
    html.find(`.class.details`).html(`
        <div class="column">
            <div class="row">
                <div class="label">Icon</div>
                <img class="class icon" src="Halloween/${data.selected_class}.svg">
            </div>

            <div class="row">
                <div class="label">Description</div>
                <p>${descriptions[data.selected_class]}</p>
            </div>
        </div>
    `);
}

async function character_creation_1(data) {
    const class_store = await game.lightbearer.Store.create("halloween_character_creation_selected_classes");
    data.closed = true;

    // Find which classes are available
    for (let _class of data.available_classes) {
        _class.available = class_store.get(_class.name)
    }

    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/character-creation-1.html",
        data
    );

    // Display html in dialog
    const dialog = halloweenDialog({
        width: 700,
        height: 400,
        title: "Character Creation (1 of 2)",
        content: templateContent,
        close: html => {
            if (data.closed && data.selected_class) {
                class_store.set(data.selected_class, true);
            }
            class_store.clear_callbacks();
        },
        render: html => {
            // Display selected race description
            if (data.selected_race) {
                html.find(`.race-picker`).val(data.selected_race);
                html.find(`.race.description`).html(`<p>${descriptions[data.selected_race]}</p>`);
            }
            // Display selected class details
            if (data.selected_class) {
                html.find(`.class-picker`).val(data.selected_class);
                fill_class_details(html, data);
            }
            // Mark taken classes
            for (let _class of data.available_classes) {
                if (data.selected_class != _class.name && !_class.available) {
                    html.find(`.class-picker .${_class.name}`).attr('disabled', 'disabled');
                }
            }
            // Listen for class disable and enable events
            class_store.add_callback((class_name, available) => {
                data.available_classes[class_name] = available;
                if (available) {
                    html.find(`.class-picker .${class_name}`).removeAttr('disabled');
                }
                else {
                    html.find(`.class-picker .${class_name}`).attr('disabled', 'disabled');
                }
            });
            // Add select race event
            html.on('change', '.race-picker', ev => {
                const race_picker = $(ev.currentTarget);
                const race_name = race_picker.val();
                data.selected_race = race_name;
                html.find(`.race.description`).html(`<p>${descriptions[data.selected_race]}</p>`);
            });
            // Add select class event
            html.on('change', '.class-picker', ev => {
                // Make sure this class is available
                const class_picker = $(ev.currentTarget);
                const class_name = class_picker.val();
                // Set the old class to available
                if (data.selected_class && data.selected_class != class_name) {
                    class_store.set(data.selected_class, true);
                }
                // Set this class to taken
                data.selected_class = class_name;
                if (data.selected_class) {
                    class_store.set(class_name, false);
                    fill_class_details(html, data);
                    data.available_abilities = [];
                    data.selected_abilities = {};
                    for (let ability of getAbilities(data.selected_class).filter(a => !a.name.endsWith("+"))) {
                        data.available_abilities.push({
                            id: randomID(),
                            name: ability.name,
                            source: data.selected_class,
                            actionCost: ability.system.actionCost,
                            cooldown: ability.system.cooldown,
                            description: ability.system.description,
                        });
                    }
                }
                else {
                    html.find(`.class.details`).html("");
                }
            });
            html.on('click', '.next', ev => {
                if (!data.selected_race) {
                    ui.notifications.error("You must select a race.");
                    return;
                }
                if (!data.selected_class) {
                    ui.notifications.error("You must select a class.");
                    return;
                }
                data.closed = false;
                character_creation_2(data);
                dialog.close();
            });
        },
    });
}

async function character_creation_2(data) {
    const token_store = await game.lightbearer.Store.create("halloween_character_creation_selected_classes");
    data.closed = true;

    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/character-creation-2.html",
        data
    );

    // Display html in dialog
    const dialog = halloweenDialog({
        title: "Character Creation: (2 of 2)",
        content: templateContent,
        close: html => {
            if (data.closed && data.selected_class) {
                token_store.set(data.selected_class, true);
            }
        },
        render: html => {
            for (let ability_id of Object.keys(data.selected_abilities)) {
                html.find(`.abilities .ability.${ability_id}`).addClass("selected");
            }
            html.on('click', '.abilities .ability', ev => {
                const card = $(ev.currentTarget);
                const ability = getAbility(card.data("source"), card.data("name"));
                if (card.hasClass("selected")) {
                    delete data.selected_abilities[card.data("id")];
                }
                else {
                    if (Object.keys(data.selected_abilities).length >= 3) {
                        return;
                    }
                    data.selected_abilities[card.data("id")] = ability;
                }
                card.toggleClass("selected");
            });
            html.on('click', '.next', ev => {
                // Make sure 3 abilities are selected
                if (Object.keys(data.selected_abilities).length != 3) {
                    ui.notifications.error("You must select three abilities.");
                    return;
                }
                data.closed = false;
                finish_character(data);
                dialog.close();
            });
            html.on('click', '.previous', ev => {
                data.closed = false;
                character_creation_1(data);
                dialog.close();
            });
        },
    });
}

async function character_creation_3(data) {
    const token_store = await game.lightbearer.Store.create("halloween_character_creation_selected_classes");
    data.closed = true;

    // Load template
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/halloween/character-creation-3.html",
        data
    );
    // Display html in dialog
    const dialog = halloweenDialog({
        title: "Character Creation: (3 of 3)",
        content: templateContent,
        close: html => {
            if (data.closed && data.selected_class) {
                token_store.set(data.selected_class, true);
            }
        },
        render: html => {
            html.on('click', '.previous', ev => {
                data.closed = false;
                character_creation_2(data);
                dialog.close();
            });
            html.on('click', '.next', async ev => {
                data.closed = false;
                finish_character(data);
                dialog.close();
            });
        },
    });
}

async function finish_character(data) {
    ui.notifications.info("Creating your character ...");
    // Figure out attributes and skills
    const attributes = {
        "agility": 13,
        "endurance": 13,
        "power": 13,
        "charisma": 13,
        "memory": 13,
        "perception": 13,
    };
    const skills = {
        "artifice": 0,
        "tracking": 0,
        "spellwork": 0,
        "melee": 0,
        "ranged": 0,
        "stealth": 0,
    };
    for (let [attribute, amount] of Object.entries(attribute_modifiers[data.selected_race])) {
        attributes[attribute] += amount;
    }
    for (let [attribute, amount] of Object.entries(attribute_modifiers[data.selected_class])) {
        attributes[attribute] += amount;
    }
    for (let skill of skill_modifiers[data.selected_race]) {
        skills[skill] += 1;
    }
    for (let skill of skill_modifiers[data.selected_class]) {
        skills[skill] += 2;
    }
    // Figure out weapons
    const all_items = {};
    const items_folder = game.folders.find(f => f.name === "Items" && f.type === "Item");
    for (let subfolder of items_folder.children) {
        for (let item of subfolder.documents) {
            all_items[item.name] = item;
        }
    }
    const selected_items = [];
    for (let item_name of weapons[data.selected_class]) {
        selected_items.push(all_items[item_name]);
    }

    // Create an actor
    const folder = game.folders.find(f => f.name === "Players" && f.type === "Actor");
    const actor = await LightbearerActor.create({
        name: `${game.user.name}'s Character`,
        type: "Character",
        folder: folder,
        img: `Halloween/${data.selected_class}.svg`,
    });
    // Add classes, races, attributes and skills
    await actor.update({
        "data.gamemode": "halloween",
        "data.class": data.selected_class,
        "data.race": data.selected_race,
        // Attributes
        "data.stats.agility": attributes.agility,
        "data.stats.endurance": attributes.endurance,
        "data.stats.power": attributes.power,
        "data.stats.charisma": attributes.charisma,
        "data.stats.memory": attributes.memory,
        "data.stats.perception": attributes.perception,
        // Skills
        "data.skills.artifice.level": skill_levels[skills.artifice],
        "data.skills.tracking.level": skill_levels[skills.tracking],
        "data.skills.spellwork.level": skill_levels[skills.spellwork],
        "data.skills.melee.level": skill_levels[skills.melee],
        "data.skills.ranged.level": skill_levels[skills.ranged],
        "data.skills.stealth.level": skill_levels[skills.stealth],
    });
    // Add race and class abilities and items
    const abilities_and_items = [];
    for (let ability of getAbilities(data.selected_race)) {
        abilities_and_items.push({
            name: ability.name,
            type: "Ability",
            data: ability.system
        });
    }
    for (let ability of Object.values(data.selected_abilities)) {
        abilities_and_items.push({
            name: ability.name,
            type: "Ability",
            data: ability.system
        });
    }
    for (let item of selected_items) {
        abilities_and_items.push({
            name: item.name,
            type: "Ability",
            data: item.system
        });
    }
    await actor.createEmbeddedDocuments("Item", abilities_and_items);
    // Set actor as selected character
    game.user.update({ "character": actor.id });
}

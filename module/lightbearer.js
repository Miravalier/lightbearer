/**
 * Lightbearer ruleset.
 * Author: Miravalier
 * Software License: MIT
 */

// Import Modules
import { LightbearerActor } from "./actor.js";
import { LightbearerItem } from "./item.js";
import { LightbearerItemSheet } from "./item-sheet.js";
import { LightbearerActorSheet } from "./actor-sheet.js";
import { onUpdateCombat } from "./combat-tracker.js";
import { onCreateChatMessage } from "./chat.js";

/* -------------------------------------------- */
/*    Foundry VTT Initialization                */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log(`Initializing Lightbearer Ruleset`);

    // Create lightbearer namespace
    game.lightbearer = {
        ItemMacro,
        ActorMacro,
        ActorOwnedItemMacro
    };

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
	    formula: "1d20",
        decimals: 2
    };

	// Define custom Entity classes
    CONFIG.Actor.entityClass = LightbearerActor;
    CONFIG.Item.entityClass = LightbearerItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("lightbearer", LightbearerActorSheet, {makeDefault: true});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("lightbearer", LightbearerItemSheet, {makeDefault: true});

    // Register system settings
    // - None
});

Hooks.once("ready", function() {
    // Register hooks
    Hooks.on("updateCombat", onUpdateCombat);
    Hooks.on("hotbarDrop", (bar, data, slot) => createLightbearerMacro(data, slot));
    Hooks.on("renderChatMessage", (app, html, data) => onCreateChatMessage(html, data));
});

async function createLightbearerMacro(data, slot) {
    let command = "";
    let source = null;
    if (data.type === "Item")
    {
        if (data.actorId) {
            command = `game.lightbearer.ActorOwnedItemMacro("${data.actorId}", "${data.data._id}");`;
            source = game.actors.get(data.actorId).getOwnedItem(data.data._id);
        }
        else {
            command = `game.lightbearer.ItemMacro("${data.id}");`;
            source = game.items.get(data.id);
        }
    }
    else if (data.type === "Actor")
    {
        command = `game.lightbearer.ActorMacro("${data.id}");`;
        source = game.actors.get(data.id);
    }
    else
    {
        throw "Invalid macro drop source.";
    }

    let macro = game.macros.entities.find(m => (m.data.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: source.name,
            type: "script",
            img: source.img,
            command: command
        });
    }

    game.user.assignHotbarMacro(macro, slot);
}

function ActorMacro(actor_id)
{
    try {
        game.actors.get(actor_id).sheet.render(true);
    }
    catch {
        console.error("The actor this macro references no longer exists.");
    }
}

function ItemMacro(item_id)
{
    try {
        game.items.get(item_id).use()
    }
    catch {
        console.error("The item this macro references no longer exists.");
    }
}

function ActorOwnedItemMacro(actor_id, item_id)
{
    try {
        game.actors.get(actor_id).getOwnedItem(item_id).use();
    }
    catch {
        console.error("Either the actor or item this macro references no longer exist.");
    }
}

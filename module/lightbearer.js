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
import { onUpdateToken } from "./combat-tracker.js";
import { forceMovementModeRefresh } from "./combat-tracker.js";
import { forceStandardModeRefresh } from "./combat-tracker.js";
import { forceModeRefresh } from "./combat-tracker.js";
import { onCreateChatMessage } from "./chat.js";
import { onChatExport } from "./chat.js";
import { preChatMessage } from "./chat.js";
import { ErrorMessage } from "./chat.js";

const STANDARD_MODE = 0;
const MOVEMENT_MODE = 1;
const COMBAT_MODE = 2;

/* -------------------------------------------- */
/*    Foundry VTT Initialization                */
/* -------------------------------------------- */

function SetMode(value)
{
    game.lightbearer.mode = value;
    switch (value)
    {
        case STANDARD_MODE:
            for (let actor of game.actors.entities.filter(a => a.isPC))
            {
                for (let token of actor.getActiveTokens())
                {
                    token.update({
                        name: actor.name,
                        displayName: TOKEN_DISPLAY_MODES.HOVER
                    });
                }
            }
        break;
        case MOVEMENT_MODE:
            for (let actor of game.actors.entities.filter(a => a.isPC))
            {
                actor.px = null;
                actor.py = null;
                actor.distance = 0;
                for (let token of actor.getActiveTokens())
                {
                    token.update({
                        name: "📐 0 ft",
                        displayName: TOKEN_DISPLAY_MODES.ALWAYS
                    });
                }
            }
        break;
        case COMBAT_MODE:
            for (let actor of game.actors.entities.filter(a => a.isPC))
            {
                for (let token of actor.getActiveTokens())
                {
                    token.update({
                        name: "Not Implemented",
                        displayName: TOKEN_DISPLAY_MODES.ALWAYS
                    });
                }
            }
        break;
        default:
            console.error("Failed to set unrecognized lightbearer mode: " + value);
        break;
    }
}

Hooks.once("init", async function() {
    console.log(`Initializing Lightbearer Ruleset`);

    // Create lightbearer namespace
    game.lightbearer = {
        ItemMacro,
        ActorMacro,
        ActorOwnedItemMacro,
        SetMode,
        STANDARD_MODE,
        MOVEMENT_MODE,
        COMBAT_MODE,
        forceMovementModeRefresh,
        forceStandardModeRefresh,
        forceModeRefresh,
        playerCharacters: {},
        emoji: {
            'think': '/systems/lightbearer/emoji/think.gif'
        }
    };
    game.lightbearer.mode = game.lightbearer.STANDARD_MODE;

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
	    formula: "1d20",
        decimals: 0
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
    // Link in other namespace items after initialization
    game.lightbearer.gm = game.users.entities.find(u => u.isGM);
    for (let actor of game.actors.entities.filter(a => a.isPC))
    {
        game.lightbearer.playerCharacters[actor.player.id] = actor.id;
    }

    // Register hooks
    Hooks.on("updateCombat", onUpdateCombat);
    Hooks.on("hotbarDrop", (bar, data, slot) => createLightbearerMacro(data, slot));
    Hooks.on("renderChatMessage", (app, html, data) => onCreateChatMessage(html, data));
    Hooks.on("createActor", (actor, options, uid) => actor.setDefaults(uid));
    Hooks.on("createItem", (item, options, uid) => item.setDefaults(uid));
    Hooks.on("chatMessage", (chatLog, message, chatData) => preChatMessage(chatLog, message, chatData));
    Hooks.on("updateToken", onUpdateToken);
    // Hook game members
    Messages.prototype.export = onChatExport;
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

/**
 * Lightbearer ruleset.
 * Author: Miravalier
 * Software License: MIT
 */

// Import Modules
import { getActor, LightbearerActor } from "./actor.js";
import { LightbearerItem } from "./item.js";
import { LightbearerItemSheet } from "./item-sheet.js";
import { LightbearerActorSheet } from "./actor-sheet.js";
import { Broadcaster, Store, open_websocket } from "./lighthouse.js";

import * as combatTracker from "./combat-tracker.js";
import * as chat from "./chat.js";
import * as ui from "./ui.js";
import * as createDefaults from "./create-defaults.js";
import * as ai from "./ai.js";



/* -------------------------------------------- */
/*    Foundry VTT Initialization                */
/* -------------------------------------------- */


function iconize(title, name, style) {
    if (style === undefined) style = "fas";
    return `<a title="${title}"><i class="${style} fa-${name}"></i></a>`;
}


Hooks.once("init", async function () {
    console.log(`Initializing Lightbearer Ruleset`);

    // Connect to lighthouse
    open_websocket();

    // Create lightbearer namespace
    game.lightbearer = {
        Store,
        Broadcaster,
        ErrorMessage: chat.ErrorMessage,
        ItemMacro,
        ActorMacro,
        OwnedItemMacro,
        getActor,
        SetNPCNames: combatTracker.SetNPCNames,
        emoji: {
            'think': '/systems/lightbearer/emoji/think.gif',
            'oof': '/systems/lightbearer/emoji/oof.png',
        },
        ui,
        statIcons: {
            "physique": iconize("Physique", "heartbeat"),
            "agility": iconize("Agility", "feather-alt"),
            "endurance": iconize("Endurance", "hiking"),
            "power": iconize("Power", "fist-raised"),
            "cunning": iconize("Cunning", "puzzle-piece"),
            "charisma": iconize("Charisma", "grin-wink"),
            "memory": iconize("Memory", "book-open"),
            "perception": iconize("Perception", "eye"),
            "artifice": iconize("Artifice", "search"),
            "tracking": iconize("Tracking", "cogs"),
            "melee": iconize("Melee Combat", "swords"),
            "ranged": iconize("Ranged Combat", "crosshairs"),
            "spellwork": iconize("Spellwork", "hand-sparkles"),
            "stealth": iconize("Stealth", "low-vision"),
        },
        ai,
        story: chat.storyCommand,
    };

    CONFIG.Combat.initiative = {
        formula: "2d6+@agility",
        decimals: 0
    };

    // Define custom document classes
    CONFIG.Actor.documentClass = LightbearerActor;
    CONFIG.Item.documentClass = LightbearerItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("lightbearer", LightbearerActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("lightbearer", LightbearerItemSheet, { makeDefault: true });

    // Handlebars helpers
    Handlebars.registerHelper('log', function (value, options) {
        console.log("HANDLEBAR LOG:", value);
    });

    Handlebars.registerHelper('ifcontains', function (a, b, options) {
        if (a.includes(b)) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifoneof', function (a, b, options) {
        if (b.split(',').indexOf(a) !== -1) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifnoneof', function (a, b, options) {
        if (b.split(',').indexOf(a) === -1) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifeq', function (a, b, options) {
        if (a == b) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifneq', function (a, b, options) {
        if (a != b) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifgt', function (a, b, options) {
        if (a > b) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifge', function (a, b, options) {
        if (a >= b) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('iflt', function (a, b, options) {
        if (a < b) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('ifle', function (a, b, options) {
        if (a <= b) { return options.fn(this); }
        return options.inverse(this);
    });

    Handlebars.registerHelper('switchon', function (value, options) {
        this.switch_value = value;
        this.switch_hit = false;
        return options.fn(this);
    });

    Handlebars.registerHelper('switchcase', function (value, options) {
        if (value == this.switch_value) {
            this.switch_hit = true;
            return options.fn(this);
        }
    });

    Handlebars.registerHelper('switchdefault', function (options) {
        if (!this.switch_hit) {
            return options.fn(this);
        }
    });


    // Early hooks
    Hooks.on("renderChatLog", (app, html, data) => chat.onRenderChatLog(html));
    Hooks.on("renderChatMessage", (app, html, data) => chat.onRenderChatMessage(html));
});

Hooks.once("ready", function () {
    // Link in other namespace items after initialization
    game.lightbearer.gm = game.users.find(u => u.isGM);
    // Register hooks
    Hooks.on("updateCombat", combatTracker.onUpdateCombat);
    Hooks.on("hotbarDrop", createMacro);
    Hooks.on("preCreateToken", createDefaults.preCreateToken);
    Hooks.on("preCreateActor", createDefaults.preCreateActor);
    Hooks.on("preCreateItem", createDefaults.preCreateItem);
    Hooks.on("chatMessage", chat.preChatMessage);
    Hooks.on("updateActor", (actor, change, options, userId) => {
        actor.onUpdate(change, options, userId);
    });
    // Hook game members
    Messages.prototype.export = chat.onChatExport;
});

async function createMacro(bar, data, slot) {
    let command = "";
    let source = null;
    if (data.type === "Item") {
        if (data.actorId) {
            command = `game.lightbearer.OwnedItemMacro("${data.actorId}", "${data.data._id}");`;
            source = game.actors.get(data.actorId).items.get(data.data._id);
        }
        else {
            command = `game.lightbearer.ItemMacro("${data.id}");`;
            source = game.items.get(data.id);
        }
    }
    else if (data.type === "Actor") {
        command = `game.lightbearer.ActorMacro("${data.id}");`;
        source = game.actors.get(data.id);
    }
    else {
        return;
    }

    let macro = game.macros.find(m => (m.data.command === command));
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

function ActorMacro(actor_id) {
    try {
        game.actors.get(actor_id).sheet.render(true);
    }
    catch {
        chat.ErrorMessage("The actor this macro references no longer exists.");
    }
}

function ItemMacro(item_id) {
    try {
        game.items.get(item_id).sheet.render(true);
    }
    catch {
        chat.ErrorMessage("The item this macro references no longer exists.");
    }
}

function OwnedItemMacro(actor_id, item_id) {
    try {
        game.actors.get(actor_id).items.get(item_id).use();
    }
    catch {
        chat.ErrorMessage("Either the actor or item this macro references no longer exist.");
    }
}

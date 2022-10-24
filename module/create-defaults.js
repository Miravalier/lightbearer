import * as utilities from "./utilities.js";

export async function preCreateItem(item, data, options, userId) {
    const updates = {};
    updates['permission.default'] = CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED;
    updates['img'] = "systems/lightbearer/resources/unknown-active.png";
    await item.updateSource(updates);
}

export async function preCreateActor(actor, data, options, userId) {
    const updates = {};
    if (!actor.img || actor.img == "icons/svg/mystery-man.svg") {
        updates['img'] = `Players/${game.user.name}/default_image.svg`;
    }
    if (userId !== game.lightbearer.gm.id) {
        updates['permission.default'] = CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED;
    }

    await actor.updateSource(updates);
}

export async function preCreateToken(token, data, options, userId) {
    const updates = {};
    const actor = game.actors.get(data.actorId);

    updates.name = actor.name;
    updates.img = actor.img;
    updates.bar1 = { attribute: "health" };
    updates.bar2 = { attribute: "armor" };

    if (actor.system.category !== "npc" || actor.system.unique) {
        updates.actorLink = true;
    }
    else {
        updates.actorLink = false;
        if (actor.system.health.formula) {
            const roll = new Roll(actor.system.health.formula, actor.getRollData());
            roll.roll();
            updates.actorData = {
                data: {
                    health: {
                        value: roll.total,
                        max: roll.total
                    }
                }
            };
        }
    }

    if (actor.system.category !== "npc") {
        updates.displayBars = CONST.TOKEN_DISPLAY_MODES.ALWAYS;
        updates.displayName = CONST.TOKEN_DISPLAY_MODES.HOVER;
        updates.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
        updates.vision = true;
        updates.brightSight = 30;
        updates.dimSight = 30;
    }
    else {
        if (actor.system.randomize_form && actor.system.forms) {
            updates.img = utilities.randSelect(Object.values(actor.system.forms)).token;
        }
        updates.displayBars = CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER;
        updates.displayName = CONST.TOKEN_DISPLAY_MODES.HOVER;
        if (actor.system.alignment == "hostile") {
            updates.disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE;
        }
        else if (actor.system.alignment == "neutral") {
            updates.disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
        }
        else if (actor.system.alignment == "friendly") {
            updates.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
        }
        updates.vision = false;
    }

    let size = 1;
    switch (actor.system.size) {
        case 'Tiny':
            {
                size = 0.5;
            }
            break;
        case 'Large':
            {
                size = 2;
            }
            break;
        case 'Huge':
            {
                size = 3;
            }
            break;
        case 'Gargantuan':
            {
                size = 4;
            }
            break;
    }
    updates.width = size;
    updates.height = size;

    updates.texture = { src: updates.img };

    await token.updateSource(updates);
}

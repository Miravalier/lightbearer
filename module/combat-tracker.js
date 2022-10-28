import { getActor } from "./actor.js";
import { TurnUpdateMessage, RoundUpdateMessage } from "./chat.js";


export function pingCombatant() {
    if (!game.combat || !game.combat.combatant) return;

    const combat = game.combat;
    const actor = combat.combatant.actor;
    const token = actor.getActiveTokens().find(t => t.id === combat.combatant.token.id);
    if (token) {
        token.setTarget(true);
        /*
        canvas.animatePan({
            x: token.x + (token.width / 2),
            y: token.y + (token.height / 2),
            duration: 500
        });
        */
        setTimeout(() => {
            token.setTarget(false);
        }, 2000);
    }
}

function advanceRound(combat, round) {
    RoundUpdateMessage(round);
    if (round == 1) {
        for (const combatant of combat.combatants) {
            combatant.actor.startCombat();
        }
    }
    else {
        for (const combatant of combat.combatants) {
            combatant.actor.advanceRound();
        }
    }
}

function revertRound(combat, round) {
    for (const combatant of combat.combatants) {
        combatant.actor.revertRound();
    }
}

function advanceTurn(combat, turn) {
    TurnUpdateMessage(combat.combatant.name, "Turn Start");
    for (const combatant of combat.combatants) {
        combatant.actor.advanceTurn();
    }
}

function revertTurn(combat, turn) {
    for (const combatant of combat.combatants) {
        combatant.actor.revertTurn();
    }
}


export function onUpdateCombat(combat, update, options, userId) {
    if (!game.user.isGM) return;
    if (!combat.combatant) return;

    pingCombatant();

    if (update.round && options.direction != -1) {
        advanceRound(combat, update.round);
        advanceTurn(combat, update.turn);
    }
    else if (update.round && options.direction == -1) {
        revertTurn(combat, update.round);
        revertRound(combat, update.round);
    }
    else if (update.turn && options.direction != -1) {
        advanceTurn(combat, update.turn);
    }
    else if (update.turn && options.direction == -1) {
        revertTurn(combat, update.turn);
    }
}


export function SetNPCNames() {
    const originals = {};
    const counts = {};
    const updates = {};
    canvas.tokens.ownedTokens.forEach(t => {
        let actor = getActor(t.actor);
        if (actor.system.category != "npc") return;
        let token = actor.getToken();

        let i = counts[actor.name];
        if (!i) {
            i = 1;
            originals[actor.name] = token;
            updates[token.id] = actor.name;
        }
        else {
            updates[token.id] = actor.name + " " + i;
        }
        if (i == 2) {
            updates[originals[actor.name].id] = actor.name + " 1";
        }
        counts[actor.name] = i + 1;
    });
    for (const [key, value] of Object.entries(updates)) {
        canvas.tokens.get(key).document.update({ name: value });
    }
}

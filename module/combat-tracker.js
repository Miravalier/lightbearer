import { getActor } from "./actor.js";
import { TurnUpdateMessage, RoundUpdateMessage, EventMessage } from "./chat.js";

export function setFlag(key, value) {
    if (game.combat) {
        game.combat.setFlag("lightbearer", key, value);
    }
}

export function getFlag(key, default_value) {
    try {
        const result = game.combat.getFlag("lightbearer", key);
        if (result === null || result === undefined) {
            return default_value;
        }
        else {
            return result;
        }
    } catch (error) {
        return default_value;
    }
}

export function pingCombatant() {
    if (!game.combat || !game.combat.combatant) return;

    const combat = game.combat;
    const actor = combat.combatant.actor;
    const token = actor.getActiveTokens().find(t => t.id === combat.combatant.token.id);
    if (token) {
        token.setTarget(true);
        canvas.animatePan({
            x: token.x + (token.width / 2),
            y: token.y + (token.height / 2),
            duration: 500
        });
        setTimeout(() => {
            token.setTarget(false);
        }, 2000);
    }
}

function advanceRound(combat, round) {
    RoundUpdateMessage(round);
    if (round == 1) {
        setFlag("rounds", 0);
        setFlag("turns", 0);
        for (const combatant of combat.combatants) {
            combatant.actor.startCombat();
        }
    }
    else {
        setFlag("rounds", getFlag("rounds", 0) + 1);
        for (const combatant of combat.combatants) {
            combatant.actor.advanceRound();
        }
        const rounds_elapsed = getFlag("rounds");
        const messages = getFlag("round_messages", []);
        for (const i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            if (rounds_elapsed >= message.expiration) {
                EventMessage(message.text, message.source);
                messages.splice(i, 1);
            }
        }
        setFlag("round_messages", messages);
    }
}

function revertRound(combat, round) {
    setFlag("rounds", getFlag("rounds", 0) - 1);
    for (const combatant of combat.combatants) {
        combatant.actor.revertRound();
    }
}

export function queueRoundMessage(rounds, source, text) {
    const messages = getFlag("round_messages", []);
    messages.push({
        expiration: getFlag("rounds", 0) + rounds,
        text: text,
        source: source
    })
    setFlag("round_messages", messages);
}

export function queueTurnMessage(turns, source, text) {
    const messages = getFlag("turn_messages", []);
    messages.push({
        expiration: getFlag("turns", 0) + turns,
        text: text,
        source: source
    });
    setFlag("turn_messages", messages);
}

function advanceTurn(combat, turn) {
    TurnUpdateMessage(combat.combatant.name, "Turn Start");
    setFlag("turns", getFlag("turns", 0) + 1);
    for (const combatant of combat.combatants) {
        combatant.actor.advanceTurn();
    }
    const turns_elapsed = getFlag("turns");
    const messages = getFlag("turn_messages", []);
    for (const i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (turns_elapsed >= message.expiration) {
            EventMessage(message.text, message.source);
            messages.splice(i, 1);
        }
    }
    setFlag("turn_messages", messages);
}

function revertTurn(combat, turn) {
    for (const combatant of combat.combatants) {
        combatant.actor.revertTurn();
    }
    setFlag("turns", getFlag("turns", 0) - 1);
}


export function onUpdateCombat(combat, update, options, userId) {
    if (!game.user.isGM) return;
    if (!combat.combatant) return;
    if (update.flags) return;

    const data = game.combat || {};

    // Set previous defaults
    if (!data.previousTurn) data.previousTurn = 0;
    if (!data.previousRound) data.previousRound = 0;

    // Make sure update has a round and a turn
    if (!update.round) update.round = data.previousRound;
    if (!update.turn) update.turn = data.previousTurn;

    pingCombatant();

    if (update.round > data.previousRound) {
        advanceRound(combat, update.round);
        advanceTurn(combat, update.turn);
    }
    else if (update.round < data.previousRound) {
        revertTurn(combat, update.round);
        revertRound(combat, update.round);
    }
    else if (update.turn > data.previousTurn) {
        advanceTurn(combat, update.turn);
    }
    else if (update.turn < data.previousTurn) {
        revertTurn(combat, update.round);
    }

    data.previousTurn = update.turn;
    data.previousRound = update.round;
    data.previousName = combat.combatant.token.name;

    game.combat.update({ "data": data });
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

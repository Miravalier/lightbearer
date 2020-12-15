import { TurnUpdateMessage, RoundUpdateMessage } from "./chat.js";

function pointDistance(x1, y1, x2, y2)
{
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function pingCombatant()
{
    if (!game.combat || !game.combat.combatant) return;

    const combat = game.combat;
    const actor = combat.combatant.actor;
    const token = actor.getActiveTokens().find(t => t.id === combat.combatant.token._id);
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


function roundAdvance(combat, round)
{
    RoundUpdateMessage(round);

    if (round == 1)
    {
        for (const combatant of combat.combatants)
        {
            combatant.actor.startCombat();
        }
    }
    else
    {
        for (const combatant of combat.combatants)
        {
            combatant.actor.startRound();
        }
    }
}

function roundRevert(combat, round)
{
    for (const combatant of combat.combatants)
    {
        combatant.actor.undoRound();
    }
}

function turnAdvance(combat, turn)
{
    TurnUpdateMessage(combat.combatant.name, "Turn Start");
}

function turnRevert(combat, turn)
{
}


export function onUpdateCombat(combat, update, options, userId)
{
    if (!game.user.isGM) return;
    if (!combat.combatant) return;
    if (combat.combatant.token.name == game.combat.data.previousName) return;

    const data = game.combat.data || {};

    // Set previous defaults
    if (data.previousTurn == undefined) data.previousTurn = 0;
    if (data.previousRound == undefined) data.previousRound = 0;

    // Make sure update has a round and a turn
    if (update.round == undefined) update.round = game.combat.data.previousRound;
    if (update.turn == undefined) update.turn = game.combat.data.previousTurn;

    pingCombatant();

    if (update.round > game.combat.data.previousRound)
    {
        roundAdvance(combat, update.round);
        turnAdvance(combat, update.turn);
    }
    else if (update.round < game.combat.data.previousRound)
    {
        turnRevert(combat, update.round);
        roundRevert(combat, update.round);
    }
    else if (update.turn > game.combat.data.previousTurn)
    {
        turnAdvance(combat, update.turn);
    }
    else if (update.turn < game.combat.data.previousTurn)
    {
        turnRevert(combat, update.round);
    }

    data.previousTurn = update.turn;
    data.previousRound = update.round;
    data.previousName = combat.combatant.token.name;
    game.combat.update(data);
}

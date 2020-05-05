import { TurnUpdateMessage, RoundUpdateMessage } from "./chat.js";

export function onUpdateCombat(combat, update, options, userId)
{
    if (!game.user.isGM) return;
    const actor = combat.combatant.actor;

    if (combat.current.round > combat.previous.round)
    {
        RoundUpdateMessage(combat.current.round, " ");
        TurnUpdateMessage(actor, "Turn Start");
        for (let token of combat.combatants)
        {
            if (!token.actor) continue;
            token.actor.startRound(combat);
        }
    }
    else if (combat.current.round < combat.previous.round)
    {
        for (let token of combat.combatants)
        {
            if (!token.actor) continue;
            token.actor.undoRound(combat);
        }
    }
    else if (combat.current.turn > combat.previous.turn)
    {
        TurnUpdateMessage(actor, "Turn Start");
    }
}

export function onUpdateCombat(combat, update, options, userId)
{
    if (combat.current.round > combat.previous.round)
    {
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
}

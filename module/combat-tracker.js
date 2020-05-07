import { TurnUpdateMessage, RoundUpdateMessage } from "./chat.js";

function pointDistance(x1, y1, x2, y2)
{
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function onUpdateCombat(combat, update, options, userId)
{
    if (!game.user.isGM) return;
    if (!combat.combatant) return;
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

export function forceModeRefresh()
{
    switch (game.lightbearer.mode)
    {
        case game.lightbearer.MOVEMENT_MODE:
            game.lightbearer.forceMovementModeRefresh()
        break;
        case game.lightbearer.STANDARD_MODE:
            game.lightbearer.forceStandardModeRefresh()
        break;
    }
}

export function forceStandardModeRefresh()
{
    // Rename all actors to their real names.
    for (let actor of game.actors.entities)
    {
        for (let token of actor.getActiveTokens())
        {
            token.update({
                name: actor.name,
                displayName: TOKEN_DISPLAY_MODES.HOVER
            });
        }
    }
}

export function forceMovementModeRefresh()
{
    // Get current scene
    const scene = game.scenes.get(game.user.viewedScene);

    // Calculate the minimum distance traveled of all actors
    const actors = game.actors.entities.filter(a => a.isPC && a.getActiveTokens().length !== 0);

    let minimumDistance = Number.MAX_SAFE_INTEGER;
    for (let actor of actors)
    {
        minimumDistance = Math.min(minimumDistance, actor.distance);
    }

    // Reduce all actor distances by the common travel distance, then
    // re-render their names.
    for (let actor of actors)
    {
        actor.distance -= minimumDistance;
        let distance = Math.round(actor.distance / scene.data.grid * scene.data.gridDistance);
        for (let token of actor.getActiveTokens())
        {
            token.update({
                name: `📐 ${distance} ${scene.data.gridUnits}`
            });
        }
    }
}

export function onUpdateToken(scene, token)
{
    if (!game.user.isGM) return;
    if (!token.actorId) return;
    if (game.lightbearer.mode !== game.lightbearer.MOVEMENT_MODE) return;

    // Make sure the token moved
    const actor = game.actors.get(token.actorId);
    if (actor.px == token.x && actor.py == token.y) return;

    // Update the moved actor
    if (actor.px === null) actor.px = token.x;
    if (actor.py === null) actor.py = token.y;

    actor.distance += pointDistance(actor.px, actor.py, token.x, token.y);
    actor.px = token.x;
    actor.py = token.y;

    // Calculate the minimum distance traveled of all actors
    const actors = game.actors.entities.filter(a => a.isPC && a.getActiveTokens().length !== 0);

    let minimumDistance = Number.MAX_SAFE_INTEGER;
    for (let actor of actors)
    {
        minimumDistance = Math.min(minimumDistance, actor.distance);
    }

    // Reduce all actor distances by the common travel distance, then
    // re-render their names.
    for (let actor of actors)
    {
        actor.distance -= minimumDistance;
        let distance = Math.round(actor.distance / scene.data.grid * scene.data.gridDistance);
        for (let token of actor.getActiveTokens())
        {
            token.update({
                name: `📐 ${distance} ${scene.data.gridUnits}`
            });
        }
    }
}

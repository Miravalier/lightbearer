import * as chat from "./chat.js";

/**
 * Base Actor class
 * @extends {Actor}
 */
export class LightbearerActor extends Actor {

    getToken() {
        // If this actor has a token, return it
        if (this.token) return this.token;

        // If one of the controlled tokens represents this actor,
        // use that token.
        let token = canvas.tokens.controlled.find(token => {
            return token.actor.id == this.id
        });
        if (token) return token;

        // If the active scene has any tokens representing this actor,
        // use one of those.
        const scene = game.scenes.get(game.user.viewedScene);
        token = this.getActiveTokens().find(token => {
            return token.scene.id == scene.id
        });
        if (token) return token;
    }

    /** @override */
    getRollData() {
        const actorData = this.data.data;
        const data = super.getRollData();
        const rollData = {};

        rollData['health'] = data.health.value;
        rollData['maxHealth'] = data.health.max;
        rollData['mana'] = data.mana.value;
        rollData['maxMana'] = data.mana.max;
        rollData['actions'] = data.actions.value;
        rollData['maxActions'] = data.actions.max;
        rollData['reactions'] = data.reactions.value;
        rollData['maxReactions'] = data.reactions.max;

        for (const [stat, value] of Object.entries(actorData.stats))
        {
            rollData[stat] = parseInt(value / 2);
        }
        rollData['physique'] = Math.round(
            (
                actorData.stats.agility
                + actorData.stats.endurance
                + actorData.stats.power
            ) / 6 // Half of average
        );
        rollData['cunning'] = Math.round(
            (
                actorData.stats.charisma
                + actorData.stats.memory
                + actorData.stats.perception
            ) / 6 // Half of average
        );

        for (const [key, skill] of Object.entries(actorData.skills))
        {
            let skillBonus = rollData[skill.stat];
            if (skill.level === "Novice") skillBonus += 2;
            else if (skill.level === "Skilled") skillBonus += 4;
            else if (skill.level === "Expert") skillBonus += 6;
            else if (skill.level === "Master") skillBonus += 8;
            else if (skill.level === "Legend") skillBonus += 10;

            rollData[key] = skillBonus;
            rollData[skill.label] = skillBonus;
            rollData[key + "_level"] = skill.level;
            rollData[skill.label + "_level"] = skill.level;
        }

        return rollData;
    }

    // Public extensions
    get player() {
        if (this.hasPlayerOwner)
        {
            return game.users.get(Object.keys(this.data.permission).find(p => p !== "default"));
        }
        else
        {
            return game.lightbearer.gm;
        }
    }

    async send(label, formula) {
        await chat.send(chat.dedent(`
            ${chat.templateHeader(this)}
            ${await chat.templateRow(label, formula, "", this.getRollData())}
        `));
    }

    startCombat() {
        const data = this.data.data;

        this.update({
            "data.mana.previous": data.mana.value,
            "data.actions.previous": data.actions.value,
            "data.reactions.previous": data.reactions.value,
            "data.mana.value": data.mana.max,
            "data.actions.value": data.actions.max,
            "data.reactions.value": data.reactions.max,
        });
    }

    // Called when a new round begins
    startRound() {
        const data = this.data.data;

        this.update({
            "data.mana.previous": data.mana.value,
            "data.actions.previous": data.actions.value,
            "data.reactions.previous": data.reactions.value,
            "data.mana.value": Math.min(data.mana.value + 1, data.mana.max),
            "data.actions.value": data.actions.max,
            "data.reactions.value": data.reactions.max,
        });
    }

    // Called when a round is reset
    undoRound() {
        const data = this.data.data;

        this.update({
            "data.mana.value": data.mana.previous,
            "data.actions.value": data.actions.previous,
            "data.reactions.value": data.reactions.previous,
        });
    }

    focusOn() {
        // Find a token of this character on the current scene
        let tokens = this.getActiveTokens();
        let scene = game.scenes.get(game.user.viewedScene);
        let token = tokens.find(t => t.scene.id == scene.id);
        if (!token) return;

        // Pan to the token
        canvas.animatePan({
            x: token.x + (unitPixels * token.width / 2),
            y: token.y + (unitPixels * token.height / 2),
            duration: 500
        });

        // Target the token
        token.setTarget(true);
        setTimeout(() => {
            token.setTarget(false);
        }, 2500);
    }
}


export function getActor(entity)
{
    // Undefined, null, empty string
    if (!entity) return null;

    // ID of some kind
    else if (typeof entity === "string")
    {
        // Try it as an actor ID
        const actor = game.actors.get(entity);
        if (actor) return getActor(actor);

        // Try it as a token ID
        const scene = game.scenes.get(game.user.viewedScene);
        const token = scene.getEmbeddedEntity("Token", entity);
        if (token) return getActor(token);

        // Return null, wrong type of string
        return null;
    }
    // Full Actor
    else if (entity.constructor.name === "LightbearerActor")
    {
        // If this actor has an associated token, return this actor
        if (entity.token) return entity;

        // If one of the controlled tokens represents this actor,
        // use that token.
        let token = canvas.tokens.controlled.find(token => {
            return token.actor.id == entity.id
        });
        if (token) return getActor(token) || entity;

        // If the active scene has any tokens representing this actor,
        // use one of those.
        const scene = game.scenes.get(game.user.viewedScene);
        token = entity.getActiveTokens().find(token => {
            return token.scene.id == scene.id
        });
        if (token) return getActor(token) || entity;

        // No token exists for this actor, so just return the tokenless actor
        return entity;
    }
    // Full Token
    else if (entity.constructor.name === "Token")
    {
        // Check if an actor is already associated
        if (entity.actor) return entity.actor;

        // Should be unreachable, tokens have actors
        console.error("Token does not have actor.");
        return null;
    }
    // Generic Data Objects
    else
    {
        if (entity.actorId && entity._id)
        {
            const actor = game.actors.get(entity.actorId);
            const token = actor.getActiveTokens().find(token => token.id == entity._id);
            return getActor(token);
        }
        else if (entity.token)
        {
            return getActor(entity.token);
        }
        else if (entity.actor)
        {
            return getActor(entity.actor);
        }
        else if (entity.id)
        {
            return getActor(entity.id);
        }
        else
        {
            return getActor(entity._id);
        }
    }
}

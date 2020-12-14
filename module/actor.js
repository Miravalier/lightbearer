import * as chat from "./chat.js";

/**
 * Base Actor class
 * @extends {Actor}
 */
export class LightbearerActor extends Actor {

    /** @override */
    getRollData() {
        const actorData = this.data.data;
        const data = super.getRollData();
        data['health'] = data.health.value;
        data['maxHealth'] = data.health.max;
        data['hp'] = data.health.value;
        data['maxHp'] = data.health.max;
        data['mana'] = data.mana.value;
        data['maxMana'] = data.mana.max;
        data['actions'] = data.actions.value;
        data['maxActions'] = data.actions.max;
        data['reactions'] = data.reactions.value;
        data['maxReactions'] = data.reactions.max;

        for (const [stat, value] of Object.entries(actorData.stats))
        {
            data[stat] = parseInt(value / 2);
        }
        data['physique'] = Math.round(
            (
                actorData.stats.agility
                + actorData.stats.endurance
                + actorData.stats.power
            ) / 6 // Half of average
        );
        data['cunning'] = Math.round(
            (
                actorData.stats.charisma
                + actorData.stats.memory
                + actorData.stats.perception
            ) / 6 // Half of average
        );

        for (const [key, skill] of Object.entries(actorData.skills))
        {
            let skillBonus = 0;
            if (skill.level === "Novice") skillBonus = 2;
            else if (skill.level === "Skilled") skillBonus = 4;
            else if (skill.level === "Expert") skillBonus = 6;
            else if (skill.level === "Master") skillBonus = 8;
            else if (skill.level === "Legend") skillBonus = 10;

            data[key] = skillBonus;
            data[skill.label] = skillBonus;
            data[key + "_level"] = skill.level;
            data[skill.label + "_level"] = skill.level;
        }

        return data;
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

    send(label, formula) {
        chat.send(chat.dedent(`
            ${chat.templateHeader(this)}
            ${chat.templateRow(label, formula, this.getRollData())}
        `));
    }

    // Called when a new round begins
    startRound(combat) {
        const actorData = this.data
        const data = actorData.data;

        if (actorData.type !== "character")
            return;

        this.update({
            "data.actions.previous": data.actions.value,
            "data.reactions.previous": data.reactions.value,
            "data.actions.value": data.actions.max,
            "data.reactions.value": data.reactions.max,
        });
    }

    // Called when a round is reset
    undoRound(combat) {
        const actorData = this.data
        const data = actorData.data;

        if (actorData.type !== "character")
            return;

        this.update({
            "data.actions.value": data.actions.previous,
            "data.reactions.value": data.reactions.previous,
        });
    }

    useAction() {
        // Only applies in combat
        if (!game.combat || !game.combat.combatant) return true;

        let actions = this.data.data.actions.value;
        if (actions <= 0) {
            chat.ErrorMessage("Not enough actions.");
            return false;
        }
        else {
            this.update({"data.actions.value": actions - 1})
            return true;
        }
    }

    useReaction() {
        // Only applies in combat
        if (!game.combat || !game.combat.combatant) return true;

        let reactions = this.data.data.reactions.value;
        if (reactions <= 0) {
            chat.ErrorMessage("Not enough reactions.");
            return false;
        }
        else {
            this.update({"data.reactions.value": reactions - 1})
            return true;
        }
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

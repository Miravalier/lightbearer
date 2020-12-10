import * as chat from "./chat.js";

const ATTRIBUTES = ["agility", "endurance", "power", "charisma", "memory", "perception"];
const STATS = ["physique", "cunning", "total"];

/**
 * Base Actor class
 * @extends {Actor}
 */
export class LightbearerActor extends Actor {

    /** @override */
    getRollData() {
        const data = super.getRollData();
        data['health'] = data.health.value;
        data['maxHealth'] = data.health.max;
        data['hp'] = data.health.value;
        data['maxHp'] = data.health.max;
        data['energy'] = data.energy.value;
        data['maxEnergy'] = data.energy.max;
        data['actions'] = data.actions.value;
        data['maxActions'] = data.actions.max;
        data['reactions'] = data.reactions.value;
        data['maxReactions'] = data.reactions.max;
        for (let attribute of ATTRIBUTES)
        {
            data[attribute] = data.attributes[attribute].value;
        }
        for (let stat of STATS)
        {
            data[stat] = data.stats[stat].value;
        }
        for (let skill of Object.keys(data.skills))
        {
            data[skill] = data.skills[skill].value;
        }
        return data;
    }

    /** @override */
    prepareData() {
        // Retrieve data
        super.prepareData();
        const actorData = this.data;
        const data = actorData.data;

        // Skip non-character actors
        if (actorData.type !== "character")
            return;

        // Set derived attributes
        data.stats.physique.value = Math.round((
            Number(data.attributes.agility.value)
            + Number(data.attributes.endurance.value)
            + Number(data.attributes.power.value)
        ) / 3);
        data.stats.cunning.value = Math.round((
            Number(data.attributes.charisma.value)
            + Number(data.attributes.memory.value)
            + Number(data.attributes.perception.value)
        ) / 3);
        data.stats.total.value = (
            Number(data.attributes.agility.value)
            + Number(data.attributes.endurance.value)
            + Number(data.attributes.power.value)
            + Number(data.attributes.charisma.value)
            + Number(data.attributes.memory.value)
            + Number(data.attributes.perception.value)
        );
    }

    // Public extensions
    get player() {
        if (this.isPC)
        {
            return game.users.get(Object.keys(this.data.permission).find(p => p !== "default"));
        }
        else
        {
            return game.lightbearer.gm;
        }
    }

    sendTemplate(template, buttons) {
        new ChatTemplate(this, template, buttons).send()
    }

    // Actor Defaults
    async setDefaults(uid) {
    }

    // Called when a new round begins
    startRound(combat) {
        const actorData = this.data
        const data = actorData.data;

        if (actorData.type !== "character")
            return;

        this.update({"data.actions.previous": data.actions.value});
        this.update({"data.reactions.previous": data.reactions.value});
        this.update({"data.actions.value": data.actions.max});
        this.update({"data.reactions.value": data.reactions.max});

        this.items.forEach(item => item.update({"data.cooldown": false}));
    }

    // Called when a round is reset
    undoRound(combat) {
        const actorData = this.data
        const data = actorData.data;

        if (actorData.type !== "character")
            return;

        this.update({"data.actions.value": data.actions.previous});
        this.update({"data.reactions.value": data.reactions.previous});
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
        let token = tokens.find(t => t.scene == scene);
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

import { ChatTemplate } from "./chat.js";

const ATTRIBUTES = ["agility", "endurance", "power", "charisma", "memory", "perception"];
const STATS = ["physique", "cunning", "total"];
const SKILLS = ["artifice", "melee", "ranged", "smithing", "stealth"];

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
        for (let skill of SKILLS)
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

        // Update token
        if (actorData.token)
        {
            actorData.token.img = actorData.img.replace('Portraits', 'Tokens');
            actorData.token.name = actorData.name;
        }
    }

    // Public extensions
    sendTemplate(template, buttons) {
        new ChatTemplate(this, template, buttons).send()
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
        let actions = this.data.data.actions.value;
        if (actions <= 0) {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content: '<div class="lightbearer error">Not enough actions.</div>'
            });
        }
        else {
            this.update({"data.actions.value": actions - 1})
        }
    }

    useReaction() {
        let reactions = this.data.data.reactions.value;
        if (reactions <= 0) {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content: '<div class="lightbearer error">Not enough reactions.</div>'
            });
        }
        else {
            this.update({"data.reactions.value": reactions - 1})
        }
    }
}

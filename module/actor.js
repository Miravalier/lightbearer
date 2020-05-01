import { ChatTemplate } from "./utils.js";

/**
 * Base Actor class
 * @extends {Actor}
 */
export class LightbearerActor extends Actor {

    /** @override */
    getRollData() {
        const data = super.getRollData();
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
        data.stats.physique.value = (
            Number(data.attributes.agility.value)
            + Number(data.attributes.endurance.value)
            + Number(data.attributes.power.value)
        );
        data.stats.cunning.value = (
            Number(data.attributes.charisma.value)
            + Number(data.attributes.memory.value)
            + Number(data.attributes.perception.value)
        );
        data.stats.total.value = (
            Number(data.stats.physique.value)
            + Number(data.stats.cunning.value)
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

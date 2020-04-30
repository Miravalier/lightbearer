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
}

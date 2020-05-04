import { ChatTemplate, ErrorMessage } from "./chat.js";

/**
 * Base Item class
 * @extends {Item}
 */
export class LightbearerItem extends Item {

    /** @override */
    prepareData() {
        // Retrieve data
        super.prepareData();
    }

    // Item Defaults
    async setDefaults(uid) {
        // Make sure only the gm sets values
        if (!game.user.isGM) return;

        // Wait for the sheet to compile
        await new Promise(resolve => setTimeout(resolve, 500));

        this.update({
            "img": "Entities/default_image.svg"
        });
    }

    // Public extensions
    use() {
        if (this.actor)
        {
            if (this.data.data.action)
            {
                this.actor.useAction();
            }
            if (this.data.data.reaction)
            {
                this.actor.useReaction();
                if (this.data.data.cooldown)
                {
                    ErrorMessage(`${this.name} is on cooldown.`);
                }
                else
                {
                    this.update({"data.cooldown": true});
                }
            }
        }
        new ChatTemplate(this).send()
    }

}


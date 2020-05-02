import { ChatTemplate } from "./chat.js";

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
            }
        }
        new ChatTemplate(this).send()
    }

}


import { ErrorMessage } from "./chat.js";

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

    // Public methods
    use() {
        if (this.actor)
        {
            if (this.data.data.action)
            {
                this.actor.useAction();
            }
            if (this.data.data.reaction)
            {
                if (this.data.data.cooldown)
                {
                    ErrorMessage(`${this.name} is on cooldown.`);
                }
                else
                {
                    this.actor.useReaction();
                    this.update({"data.cooldown": true});
                }
            }
        }
        // TODO send chat template
    }
}

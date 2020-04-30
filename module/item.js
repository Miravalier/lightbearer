import { ChatTemplate } from "./utils.js";

/**
 * Base Item class
 * @extends {Item}
 */
export class LightbearerItem extends Item {
    // Public extensions
    use() {
        new ChatTemplate(this).send()
    }
}

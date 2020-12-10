import * as ui from "./ui.js";
import * as chat from "./chat.js";

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
    async use(usingToken) {
        if (!usingToken) {
            const scene = game.scenes.get(game.user.viewedScene);
            usingToken = this.actor.getActiveTokens().find(token => {
                return token.scene.id == scene.id;
            })
        }
        if (!this.actor) {
            return;
        }

        const rows = [];

        // For each target
        for (const target of Object.values(this.data.data.targets))
        {
            let template = null;
            const actors = [];
            if (target.type == "None") {
                actors.push(this.actor);
            }
            else if (target.type == "Creature") {
                const creature = await ui.selectCreature();
                if (creature.actor)
                {
                    actors.push(creature.actor);
                }
                else
                {
                    actors.push(game.actors.get(creature.actorId));
                }
            }
            else if (target.type == "Group") {
                const creatures = await ui.selectGroup();
                for (const creature of creatures) {
                    if (creature.actor)
                    {
                        actors.push(creature.actor);
                    }
                    else
                    {
                        actors.push(game.actors.get(creature.actorId));
                    }
                }
            }
            else
            {
                if (target.type == "Square") {
                    const size = target.size;
                    template = await ui.selectShape({
                        shape: "ray",
                        width: size,
                        length: size,
                        offset: {x: -size * 10}
                    });
                }
                else if (target.type == "Sphere") {
                    template = await ui.selectFixedShape({
                        shape: "circle",
                        length: target.radius
                    });
                }
                else if (target.type == "Ray") {
                    template = await ui.selectShape({
                        shape: "ray",
                        length: target.length
                    });
                }
                else if (target.type == "Cone") {
                    template = await ui.selectShape({
                        shape: "cone",
                        length: target.length
                    });
                }
                else if (target.type == "Close Square") {
                    const size = target.size;
                    template = await ui.selectShape({
                        shape: "ray",
                        width: size,
                        length: size,
                        offset: {x: -size * 10},
                        origin: usingToken
                    });
                }
                else if (target.type == "Close Sphere") {
                    template = await ui.selectShape({
                        shape: "circle",
                        length: target.radius,
                        origin: usingToken
                    });
                }
                else if (target.type == "Close Ray") {
                    template = await ui.selectShape({
                        shape: "ray",
                        length: target.length,
                        origin: usingToken
                    });
                }
                else if (target.type == "Close Cone") {
                    template = await ui.selectShape({
                        shape: "cone",
                        length: target.length,
                        origin: usingToken
                    });
                }
                template.tokens.forEach(token => {
                    actors.push(game.actors.get(token.actorId));
                });
            }

            for (const actor of actors)
            {
                rows.push(chat.templateRow(actor.name));
                for (const effect of Object.values(target.effects))
                {
                    rows.push(chat.templateRow(effect.type));
                }
            }
        }

        // Use action / reaction / cooldown status
        if (this.data.data.action)
        {
            this.actor.useAction();
        }
        if (this.data.data.reaction)
        {
            if (this.data.data.cooldown)
            {
                chat.ErrorMessage(`${this.name} is on cooldown.`);
            }
            else
            {
                this.actor.useReaction();
                this.update({"data.cooldown": true});
            }
        }

        // Send complete template into the chat
        chat.send(chat.templateHeader(this) + rows.join('\n'));
    }
}

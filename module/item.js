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

        const items = [];
        const results = {};

        // For each target
        const targets = Object.values(this.data.data.targets);
        for (const target of targets)
        {
            let template = null;
            const actors = [];
            if (target.type == "None") {
                actors.push(this.actor);
            }
            else if (target.type == "Creature") {
                const creature = await ui.selectCreature();
                if (!creature)
                {
                    continue;
                }
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
                    const size = (target.radius*2) + 0.5;
                    template = await ui.selectFixedShape({
                        shape: "ray",
                        width: size,
                        length: size,
                        offset: {x: -size * 10}
                    });
                }
                else if (target.type == "Sphere") {
                    template = await ui.selectFixedShape({
                        shape: "circle",
                        length: target.radius + 0.5
                    });
                }
                else if (target.type == "Ray") {
                    template = await ui.selectShape({
                        shape: "ray",
                        length: target.length + 0.5
                    });
                }
                else if (target.type == "Cone") {
                    template = await ui.selectShape({
                        shape: "cone",
                        length: target.length + 0.5
                    });
                }
                else if (target.type == "Close Square") {
                    const size = (target.radius*2) + 0.5;
                    template = await ui.selectFixedShape({
                        shape: "ray",
                        width: size,
                        length: size,
                        offset: {x: -size * 10},
                        origin: usingToken
                    });
                }
                else if (target.type == "Close Sphere") {
                    template = await ui.selectFixedShape({
                        shape: "circle",
                        length: target.radius + 0.5,
                        origin: usingToken
                    });
                }
                else if (target.type == "Close Ray") {
                    template = await ui.selectShape({
                        shape: "ray",
                        length: target.length + 0.5,
                        origin: usingToken
                    });
                }
                else if (target.type == "Close Cone") {
                    template = await ui.selectShape({
                        shape: "cone",
                        length: target.length + 0.5,
                        origin: usingToken
                    });
                }
                if (template)
                {
                    template.tokens.forEach(token => {
                        if (token.actor !== undefined)
                        {
                            actors.push(token.actor);
                        }
                        else
                        {
                            actors.push(game.actors.get(token.actorId));
                        }
                    });
                }
                Object.values(target.effects).filter(e => e.type == "Texture").forEach(effect => {
                    const templateData = {position: template.position};
                    if (effect.texture) {
                        templateData.texture = effect.texture;
                    }
                    templateData.offset = {x: -50, y: -50};

                    if (target.type == "Square")
                    {
                        const size = (target.radius*2) + 0.5;
                        templateData.shape = "ray";
                        templateData.width = size;
                        templateData.length = size;
                        templateData.offset = {x: -size * 10};
                    }
                    else if (target.type == "Sphere")
                    {
                        templateData.shape = "circle";
                        templateData.length = target.radius + 0.5;
                        templateData.offset = {x: 0, y: 0};
                    }
                    else if (target.type == "Ray")
                    {
                        templateData.shape = "ray";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    else if (target.type == "Cone")
                    {
                        templateData.shape = "cone";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    else if (target.type == "Close Square")
                    {
                        const size = (target.radius*2) + 0.5;
                        templateData.shape = "ray";
                        templateData.width = size;
                        templateData.length = size;
                    }
                    else if (target.type == "Close Sphere")
                    {
                        templateData.shape = "circle";
                        templateData.length = target.radius + 0.5;
                    }
                    else if (target.type == "Close Ray")
                    {
                        templateData.shape = "ray";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    else if (target.type == "Close Cone")
                    {
                        templateData.shape = "cone";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    ui.createTemplate(templateData);
                });
            }

            for (const actor of actors)
            {
                let subitems = [];
                if (results[actor.id] !== undefined)
                {
                    subitems = results[actor.id];
                }
                else
                {
                    results[actor.id] = subitems;
                }

                for (const effect of Object.values(target.effects))
                {
                    if (effect.type == "Amount")
                    {
                        subitems.push(chat.templateRow(
                            effect.label,
                            effect.formula,
                            effect.color,
                            actor.getRollData(),
                        ));
                    }
                    else if (effect.type == "Check")
                    {
                        subitems.push(chat.templateRow(
                            `${game.lightbearer.statIcons[effect.stat]} Check`,
                            `2d6+@${effect.stat}`,
                            "",
                            actor.getRollData()
                        ));
                    }
                    else if (effect.type == "Opposed Check")
                    {
                        subitems.push(chat.templateRow(
                            `Target ${game.lightbearer.statIcons[effect.stat]}`,
                            `2d6+@${effect.stat}`,
                            "",
                            actor.getRollData()
                        ));

                        subitems.push(chat.templateRow(
                            `Source ${game.lightbearer.statIcons[effect.stat]}`,
                            `2d6+@${effect.stat}`,
                            "",
                            this.actor.getRollData()
                        ));
                    }
                    else if (effect.type == "Text")
                    {
                        subitems.push(chat.templateDescription(effect.text));
                    }
                    else if (effect.type == "Texture")
                    {
                        // Handled elsewhere.
                    }
                    else
                    {
                        subitems.push(chat.templateDescription("Unrecognized effect: " + effect.type));
                    }
                }
            }
        }

        const resultEntries = Object.entries(results);
        for (const [actorId, subitems] of resultEntries)
        {
            const actor = game.actors.get(actorId);
            if (resultEntries.length == 1 && actor.id == this.actor.id) {
                items.push(chat.templateActor(actor, subitems.join('\n'), false));
            }
            else {
                items.push(chat.templateActor(actor, subitems.join('\n'), true));
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
        chat.send(chat.templateHeader(this) + items.join('\n'));
    }
}

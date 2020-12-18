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
        // Try to find the token in the list of controlled tokens
        if (!usingToken) {
            usingToken = canvas.tokens.controlled.find(token => {
                return token.actor.id == this.actor.id;
            });
        }
        // Try to find the token in the active scene
        if (!usingToken) {
            const scene = game.scenes.get(game.user.viewedScene);
            usingToken = this.actor.getActiveTokens().find(token => {
                return token.scene.id == scene.id;
            });
        }
        // If no token was found, return
        if (!usingToken) {
            return;
        }

        const items = [chat.templateDescription(this.data.data.description)];
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
                if (template && target.criteria != "None")
                {
                    template.tokens.forEach(token => {
                        let actor;
                        if (token.actor !== undefined)
                            actor = token.actor;
                        else
                            actor = game.actors.get(token.actorId);

                        console.log(target.criteria, token.name, token.disposition, usingToken.data.disposition);

                        if (actor.id == this.actor.id &&
                                target.type.startsWith("Close") &&
                                !target.includeSelf)
                            return;

                        if (target.criteria == "Enemy" &&
                                token.disposition == usingToken.data.disposition)
                            return;

                        if (target.criteria == "Ally" &&
                                token.disposition != usingToken.data.disposition)
                            return;

                        
                        actors.push(actor);
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
                    else if (effect.type == "Table")
                    {
                        const choices = effect.choices.split(',').map(c => c.trim());
                        const choice = choices[Math.floor(Math.random() * choices.length)];
                        subitems.push(chat.templateRow(
                            effect.label,
                            choice,
                            effect.color,
                            actor.getRollData()
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
            if (actor.id == this.actor.id) {
                items.push(chat.templateActor(actor, subitems.join('\n'), "Self"));
            }
            else {
                items.push(chat.templateActor(actor, subitems.join('\n')));
            }
        }

        if (game.combat && game.combat.combatant) {
            const updates = {};

            // Use action / reaction
            if (this.data.data.actionCost == "action")
            {
                updates["data.actions.value"] = this.actor.data.data.actions.value - 1;

            }
            else if (this.data.data.actionCost == "reaction")
            {
                updates["data.reactions.value"] = this.actor.data.data.reactions.value - 1;
            }

            // Spend mana
            const mana = this.data.data.manaCost;
            if (mana)
            {
                updates["data.mana.value"] = this.actor.data.data.mana.value - mana;
            }

            this.actor.update(updates);
        }

        // Send complete template into the chat
        chat.send(chat.templateHeader(this) + items.join('\n'));
    }
}

import * as ui from "./ui.js";
import * as chat from "./chat.js";
import { getActor } from "./actor.js";

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
        // Get the caster actor
        let caster = null;
        if (usingToken)
            caster = getActor(usingToken);
        else
            caster = getActor(this.actor);

        // Get the caster token
        const casterToken = caster.getToken();

        const items = [];
        const results = {};

        // For each target
        const targets = Object.values(this.data.data.targets);
        for (const target of targets)
        {
            let template = null;
            const actors = [];
            if (target.type == "None") {
                actors.push(caster);
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
                        origin: casterToken.data
                    });
                }
                else if (target.type == "Close Sphere") {
                    template = await ui.selectFixedShape({
                        shape: "circle",
                        length: target.radius + 0.5,
                        origin: casterToken.data
                    });
                }
                else if (target.type == "Close Ray") {
                    template = await ui.selectShape({
                        shape: "ray",
                        length: target.length + 0.5,
                        origin: casterToken.data
                    });
                }
                else if (target.type == "Close Cone") {
                    template = await ui.selectShape({
                        shape: "cone",
                        length: target.length + 0.5,
                        origin: casterToken.data
                    });
                }
                if (template && target.criteria != "None")
                {
                    template.tokens.forEach(token => {
                        let actor = getActor(token);
                        let actorToken = actor.getToken();

                        let casterFaction = (caster.data.data.category == "npc");
                        let otherFaction = (actor.data.data.category == "npc");

                        if (actorToken.id == casterToken.id &&
                                target.type.startsWith("Close") &&
                                !target.includeSelf)
                            return;

                        if (target.criteria == "Enemy" && casterFaction == otherFaction)
                            return;

                        if (target.criteria == "Ally" && casterFaction != otherFaction)
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
                let token = actor.getToken();

                if (results[token.id] !== undefined)
                {
                    subitems = results[token.id];
                }
                else
                {
                    results[token.id] = subitems;
                }

                for (const effect of Object.values(target.effects))
                {
                    if (effect.type == "Amount")
                    {
                        subitems.push(await chat.templateRow(
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
                        subitems.push(await chat.templateRow(
                            effect.label,
                            choice,
                            effect.color,
                            actor.getRollData()
                        ));
                    }
                    else if (effect.type == "Check")
                    {
                        subitems.push(await chat.templateRow(
                            `${game.lightbearer.statIcons[effect.stat]} Check`,
                            `2d6+@${effect.stat}`,
                            "",
                            actor.getRollData()
                        ));
                    }
                    else if (effect.type == "Opposed Check")
                    {
                        subitems.push(await chat.templateRow(
                            `Target ${game.lightbearer.statIcons[effect.stat]}`,
                            `2d6+@${effect.stat}`,
                            "",
                            actor.getRollData()
                        ));

                        subitems.push(await chat.templateRow(
                            `Source ${game.lightbearer.statIcons[effect.stat]}`,
                            `2d6+@${effect.stat}`,
                            "",
                            caster.getRollData()
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
        for (const [tokenId, subitems] of resultEntries)
        {
            const actor = getActor(tokenId);
            const token = actor.getToken();
            if (token.id == casterToken.id) {
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
                updates["data.actions.value"] = caster.data.data.actions.value - 1;
            }
            else if (this.data.data.actionCost == "reaction")
            {
                updates["data.reactions.value"] = caster.data.data.reactions.value - 1;
            }

            // Spend mana
            const mana = this.data.data.manaCost;
            if (mana)
            {
                updates["data.mana.value"] = Math.min(
                    caster.data.data.mana.value - mana,
                    caster.data.data.mana.max
                );
            }

            caster.update(updates);
        }

        // Send complete template into the chat
        chat.send(chat.templateHeader(this, casterToken) + items.join('\n'));
    }
}

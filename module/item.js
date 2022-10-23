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
        // Get the current scene
        const scene = game.scenes.get(game.user.viewedScene);
        const pixelsPerFoot = scene.grid.size / scene.grid.distance;
        const pixelsPerSquare = scene.grid.size;

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
        const targets = Object.values(this.system.targets);
        for (const target of targets) {
            let template = null;
            const actors = [];
            if (target.type == "None") {
                actors.push(caster);
            }
            else if (target.type == "Creature") {
                const creature = await ui.selectCreature();
                // Quit ability early on cancelled select
                if (!creature) {
                    return;
                }
                if (creature.actor) {
                    actors.push(creature.actor);
                }
                else {
                    actors.push(game.actors.get(creature.actorId));
                }
            }
            else if (target.type == "Group") {
                const creatures = await ui.selectGroup();
                // Quit ability early on cancelled select
                if (creatures === null) {
                    return;
                }
                for (const creature of creatures) {
                    if (creature.actor) {
                        actors.push(creature.actor);
                    }
                    else {
                        actors.push(game.actors.get(creature.actorId));
                    }
                }
            }
            else {
                if (target.type == "Square") {
                    const diameterFeet = (target.radius * 2) + 0.5;
                    template = await ui.selectFixedShape({
                        shape: "ray",
                        width: diameterFeet,
                        length: diameterFeet,
                        offset: { x: -(diameterFeet/2) * pixelsPerFoot },
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
                    const diameterFeet = (target.radius * 2) + 0.5;
                    template = await ui.selectFixedShape({
                        shape: "ray",
                        width: diameterFeet,
                        length: diameterFeet,
                        offset: { x: -(diameterFeet/2) * pixelsPerFoot },
                        origin: casterToken.center
                    });
                }
                else if (target.type == "Close Sphere") {
                    template = await ui.selectFixedShape({
                        shape: "circle",
                        length: target.radius + 0.5,
                        origin: casterToken.center
                    });
                }
                else if (target.type == "Close Ray") {
                    template = await ui.selectShape({
                        shape: "ray",
                        length: target.length + 0.5,
                        origin: casterToken.center
                    });
                }
                else if (target.type == "Close Cone") {
                    template = await ui.selectShape({
                        shape: "cone",
                        length: target.length + 0.5,
                        origin: casterToken.center
                    });
                }
                if (template === null) {
                    return;
                }
                if (template && target.criteria != "None") {
                    for (let token of template.tokens) {
                        const actor = getActor(token);
                        const actorToken = actor.getToken();

                        const casterFaction = casterToken.disposition;
                        const otherFaction = actorToken.disposition;

                        if (actorToken.id == casterToken.id &&
                            target.type.startsWith("Close") &&
                            !target.includeSelf)
                            continue;

                        if (target.criteria == "Enemy" && casterFaction == otherFaction)
                            continue;

                        if (target.criteria == "Ally" && casterFaction != otherFaction)
                            continue;

                        actors.push(actor);
                    }
                }
                for (let effect of Object.values(target.effects).filter(e => e.type == "Texture")) {
                    const templateData = { position: template.position };
                    if (effect.texture) {
                        templateData.texture = `Textures/${effect.texture}.png`;
                    }
                    templateData.offset = { x: -(pixelsPerSquare / 2), y: -(pixelsPerSquare / 2) };

                    if (target.type == "Square") {
                        const sizeFeet = (target.radius * 2) + 0.5;
                        templateData.shape = "ray";
                        templateData.width = sizeFeet;
                        templateData.length = sizeFeet;
                        templateData.offset = { x: -size * pixelsPerFoot };
                    }
                    else if (target.type == "Sphere") {
                        templateData.shape = "circle";
                        templateData.length = target.radius + 0.5;
                        templateData.offset = { x: 0, y: 0 };
                    }
                    else if (target.type == "Ray") {
                        templateData.shape = "ray";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    else if (target.type == "Cone") {
                        templateData.shape = "cone";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    else if (target.type == "Close Square") {
                        const sizeFeet = (target.radius * 2) + 0.5;
                        templateData.shape = "ray";
                        templateData.width = sizeFeet;
                        templateData.length = sizeFeet;
                    }
                    else if (target.type == "Close Sphere") {
                        templateData.shape = "circle";
                        templateData.length = target.radius + 0.5;
                    }
                    else if (target.type == "Close Ray") {
                        templateData.shape = "ray";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    else if (target.type == "Close Cone") {
                        templateData.shape = "cone";
                        templateData.length = target.length + 0.5;
                        templateData.direction = template.direction;
                    }
                    ui.createTemplate(templateData);
                }
            }

            for (const actor of actors) {
                let subitems = [];
                let token = actor.getToken();

                if (results[token.id] !== undefined) {
                    subitems = results[token.id];
                }
                else {
                    results[token.id] = subitems;
                }

                for (const effect of Object.values(target.effects)) {
                    if (effect.type == "Amount") {
                        subitems.push(await chat.templateRow(
                            effect.label,
                            effect.formula,
                            effect.color,
                            actor.getRollData(),
                        ));
                    }
                    else if (effect.type == "Table") {
                        const choices = effect.choices.split(',').map(c => c.trim());
                        const choice = choices[Math.floor(Math.random() * choices.length)];
                        subitems.push(await chat.templateRow(
                            effect.label,
                            choice,
                            effect.color,
                            actor.getRollData()
                        ));
                    }
                    else if (effect.type == "Check") {
                        subitems.push(await chat.templateRow(
                            `${game.lightbearer.statIcons[effect.stat]} Check`,
                            `2d6+@${effect.stat}`,
                            "",
                            actor.getRollData()
                        ));
                    }
                    else if (effect.type == "Opposed Check") {
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
                    else if (effect.type == "Text") {
                        subitems.push(chat.templateDescription(effect.text));
                    }
                    else if (effect.type == "Texture") {
                        // Handled elsewhere.
                    }
                    else {
                        subitems.push(chat.templateDescription("Unrecognized effect: " + effect.type));
                    }
                }
            }
        }

        const resultEntries = Object.entries(results);
        for (const [tokenId, subitems] of resultEntries) {
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
            if (this.system.actionCost == "action") {
                updates["data.actions.value"] = caster.system.actions.value - 1;
            }
            else if (this.system.actionCost == "reaction") {
                updates["data.reactions.value"] = caster.system.reactions.value - 1;
            }
            // Activate cooldown
            const cooldown = parseInt(this.system.cooldown);
            if (cooldown > 0) {
                if (caster.system.cooldowns === null) {
                    const cd_update = {};
                    cd_update[this.id] = cooldown;
                    updates["data.cooldowns"] = cd_update;
                }
                else {
                    updates[`data.cooldowns.${this.id}`] = cooldown;
                }
            }

            caster.update(updates);
        }

        // Send complete template into the chat
        chat.send(chat.templateHeader(this, casterToken) + items.join('\n'));
    }
}

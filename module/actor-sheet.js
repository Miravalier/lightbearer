import { getAbilities, getAbility } from "./utilities.js";
import * as chat from "./chat.js";
import * as halloween from "./halloween.js";

/**
 * Extends the basic ActorSheet.
 * @extends {ActorSheet}
 */
export class LightbearerActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["lightbearer", "sheet", "actor"],
            template: "systems/lightbearer/html/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }],
            dragDrop: [{ dragSelector: ".abilities .ability" }],
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const actorData = this.actor.system;
        const data = super.getData();
        data.abilities = [];
        for (let item of data.items) {
            if (item.type === "Ability") {
                let cooldown_remaining = null;
                if (actorData.cooldowns !== null) {
                    cooldown_remaining = actorData.cooldowns[item._id];
                }
                if (!cooldown_remaining || cooldown_remaining < 0) {
                    cooldown_remaining = 0;
                }
                item.system.cooldown_remaining = cooldown_remaining;
                data.abilities.push(item);
            }
        }

        // Find available abilities
        data.available = [];
        if (actorData.category == "single") {
            for (let ability of getAbilities(actorData['class'])) {
                data.available.push({
                    name: ability.name,
                    source: actorData['class'],
                    actionCost: ability.system.actionCost,
                    cooldown: ability.system.cooldown,
                });
            }
        }
        else if (actorData.category == "dual") {
            for (let ability of getAbilities(actorData['class_one'])) {
                if (ability.name.endsWith("+")) continue;
                data.available.push({
                    name: ability.name,
                    source: actorData['class_one'],
                    actionCost: ability.system.actionCost,
                    cooldown: ability.system.cooldown,
                });
            }
            for (let ability of getAbilities(actorData['class_two'])) {
                if (ability.name.endsWith("+")) continue;
                data.available.push({
                    name: ability.name,
                    source: actorData['class_two'],
                    actionCost: ability.system.actionCost,
                    cooldown: ability.system.cooldown,
                });
            }
        }
        for (let ability of getAbilities(actorData['race'])) {
            data.available.push({
                name: ability.name,
                source: actorData['race'],
                actionCost: ability.system.actionCost,
                cooldown: ability.system.cooldown,
            });
        }

        // Determine physique and cunning
        data.physique = Math.round(
            (
                actorData.stats.agility
                + actorData.stats.endurance
                + actorData.stats.power
            ) / 3
        );
        data.cunning = Math.round(
            (
                actorData.stats.charisma
                + actorData.stats.memory
                + actorData.stats.perception
            ) / 3
        );

        // Sum up the stat total
        data.statTotal = 0;
        for (const value of Object.values(actorData.stats)) {
            data.statTotal += value;
        }

        // Sum up the skill total
        data.skillTotal = 0;
        for (const skill of Object.values(actorData.skills)) {
            if (skill.level === 'Novice') data.skillTotal += 1;
            else if (skill.level === 'Skilled') data.skillTotal += 2;
            else if (skill.level === 'Expert') data.skillTotal += 3;
            else if (skill.level === 'Master') data.skillTotal += 6;
            else if (skill.level === 'Legend') data.skillTotal += 12;
        }

        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Edit Ability: name or edit button
        html.find('.known .ability .control.edit').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.items.get(li.data("itemId"));
            ability.sheet.render(true);
        });
        html.find('.known .ability .name').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.items.get(li.data("itemId"));
            ability.sheet.render(true);
        });

        // Available ability preview
        html.find('.available .ability .name').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = getAbility(li.data("source"), li.data("name"));
            ability.sheet.render(true);
        });

        /*****************
         * View-Only End *
         *****************/
        if (!this.options.editable) return;

        // NPC
        html.find(".new-form").click(async ev => {
            const updates = {};
            updates[`data.forms._${randomID(16)}`] = {
                "token": "",
            };
            await this.actor.update(updates);
        });
        html.find(".use-form").click(async ev => {
            const element = $(ev.currentTarget).parent();
            const form = this.actor.system.forms[element.data("id")];
            for (let token of this.actor.getActiveTokens()) {
                await token.scene.updateEmbeddedDocuments(
                    "Token",
                    [{
                        "_id": token.id,
                        "img": form.token,
                    }]
                );
            }
        });
        html.find(".delete-form").click(ev => {
            const element = $(ev.currentTarget).parent();
            const updates = {};
            updates[`data.forms.-=${element.data("id")}`] = null;

            Dialog.confirm({
                title: `Delete Form?`,
                content: "",
                yes: html => {
                    this.actor.update(updates);
                },
                no: () => { },
                defaultYes: false
            });
        });

        // Event buttons
        html.find(".injury.button").click(async ev => {
            await this.actor.update({
                "data.resources.injury": false,
            });
            await halloween.injure(this.actor);
        });

        html.find(".level-up.button").click(async ev => {
            await this.actor.update({
                "data.resources.level_up": false,
            });
            await halloween.levelup(this.actor);
        });

        // Ability hiding
        html.find(".hide-available").click(ev => {
            this.actor.update({ "data.availableHidden": true });
        });

        html.find(".show-available").click(ev => {
            this.actor.update({ "data.availableHidden": false });
        });

        // Stat rolls
        html.find(".roll-stat").click(ev => {
            const attribute = ev.target.closest(".attribute");
            this.actor.send(attribute.dataset.label, `2d6+@${attribute.dataset.key}`);
        });

        html.find(".roll-skill").click(ev => {
            const skill = ev.target.closest(".skill");
            this.actor.send(skill.dataset.label, `2d6+@${skill.dataset.key}`);
        });

        // New Ability
        html.find('.new-ability').click(ev => {
            this.actor.createEmbeddedDocuments(
                "Item",
                [{
                    name: "New Ability",
                    type: "Ability"
                }],
                { renderSheet: true }
            );
        });

        // Available ability select
        html.find('.available .ability .control.select').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = getAbility(li.data("source"), li.data("name"));
            this.actor.createEmbeddedDocuments(
                "Item",
                [{
                    name: ability.name,
                    type: "Ability",
                    data: ability.system
                }]
            );
        });

        // Use Ability
        html.find('.known .ability .control.use').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.items.get(li.data("itemId"));
            ability.use();
        });

        // Reset Ability
        html.find('.known .ability .control.reset').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability_id = li.data("itemId");
            const updates = {};
            updates[`data.cooldowns.${ability_id}`] = 0;
            this.actor.update(updates);
        });

        // Show Ability
        html.find('.known .ability .control.show').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.items.get(li.data("itemId"));
            chat.send(chat.templateHeader(ability));
        });

        // Delete Ability
        html.find('.known .ability .control.delete').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.items.get(li.data("itemId"));
            Dialog.confirm({
                title: `Delete ${ability.name}?`,
                content: "",
                yes: html => {
                    this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
                    li.slideUp(200, () => this.render(false));
                },
                no: () => { },
                defaultYes: false
            });
        });
    }
}

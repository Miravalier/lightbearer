import * as chat from "./chat.js";

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
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities"}]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const actorData = this.actor.data.data;
        const data = super.getData();
        data.inventory = [];
        data.abilities = [];
        for (let item of data.items)
        {
            if (item.type === "Item")
            {
                data.inventory.push(item);
            }
            else if (item.type === "Ability")
            {
                data.abilities.push(item);
            }
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
        for (const value of Object.values(actorData.stats))
        {
            data.statTotal += value;
        }

        // Sum up the skill total
        data.skillTotal = 0;
        for (const skill of Object.values(actorData.skills))
        {
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

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

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
            this.actor.createOwnedItem({
                name: "New Ability",
                type: "Ability"
            });
        });

        // Use Ability
        html.find('.ability .name').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.getOwnedItem(li.data("itemId"));
            ability.use();
        });

        // Show Ability
        html.find('.ability .control.show').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.getOwnedItem(li.data("itemId"));
            chat.send(chat.dedent(`
                ${chat.templateHeader(ability)}
                ${chat.templateDescription(ability.data.data.description)}
            `));
        });

        // Update Ability
        html.find('.ability .control.edit').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.getOwnedItem(li.data("itemId"));
            ability.sheet.render(true);
        });

        // Delete Ability
        html.find('.ability .control.delete').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.getOwnedItem(li.data("itemId"));
            Dialog.confirm({
                title: `Delete ${ability.name}?`,
                content: "",
                yes: html => {
                    this.actor.deleteOwnedItem(li.data("itemId"));
                    li.slideUp(200, () => this.render(false));
                },
                no: () => {},
                defaultYes: false
            });
        });
    }
}

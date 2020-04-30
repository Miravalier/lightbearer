/**
 * Extends the basic ActorSheet.
 * @extends {ActorSheet}
 */
export class LightbearerActorSheet extends ActorSheet {

    /** @override */
	static get defaultOptions() {
	    return mergeObject(super.defaultOptions, {
  	        classes: ["lightbearer", "sheet", "actor"],
  	        template: "systems/lightbearer/templates/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities"}]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.inventory = [];
        data.abilities = [];
        for (let item of data.items)
        {
            if (item.type === "item")
            {
                data.inventory.push(item);
            }
            else if (item.type === "ability")
            {
                data.abilities.push(item);
            }
        }
        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options={}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Item / Ability Dragging
        let handler = ev => this._onDragItemStart(ev);
        html.find('li.item').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });
        html.find('li.ability').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        // Stat rolls
        html.find('.stat-roll-icon').click(ev => {
            const li = $(ev.currentTarget).parents(".attribute");
            const stat = this.actor.data.data.stats[li.data('attribute')];
            const percentage = (1 + (stat.value / 30)).toPrecision(3);
            this.actor.sendTemplate({"A": {"label": stat.label, "roll": `2d6 * ${percentage}`}});
        });

        // Attribute rolls
        html.find('.attribute-roll-icon').click(ev => {
            const li = $(ev.currentTarget).parents(".attribute");
            const attribute = this.actor.data.data.attributes[li.data('attribute')];
            const percentage = (1 + attribute.value / 10).toPrecision(3);
            this.actor.sendTemplate({"A": {"label": attribute.label, "roll": `2d6 * ${percentage}`}});
        });

        // Skill rolls
        html.find('.skill-roll-icon').click(ev => {
            const li = $(ev.currentTarget).parents(".skill");
            const skill = this.actor.data.data.skills[li.data('skill')];
            const percentage = (1 + skill.value / 100).toPrecision(3);
            this.actor.sendTemplate({"A": {"label": skill.label, "roll": `2d6 * ${percentage}`}});
        });

        // Use Inventory Item
        html.find('.item-icon').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.use();
        });
        html.find('.item-name').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.use();
        });

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });

        // Use Ability
        html.find('.ability-icon').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.getOwnedItem(li.data("itemId"));
            ability.use();
        });

        html.find('.ability-name').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.getOwnedItem(li.data("itemId"));
            ability.use();
        });

        // Update Ability
        html.find('.ability-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            const ability = this.actor.getOwnedItem(li.data("itemId"));
            ability.sheet.render(true);
        });

        // Delete Ability
        html.find('.ability-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".ability");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });
    }
}

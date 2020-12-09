/**
 * Extensible item sheet.
 * @extends {ItemSheet}
 */
export class LightbearerItemSheet extends ItemSheet {

    storeValue(path, value) {
        if (!value)
        {
            value = "";
        }
        let newFieldId = "_" + randomID(16);
        let newField = document.createElement("div");
        newField.innerHTML = `<input class="invisible" type="text" name="${path.replace('$id', newFieldId)}" value="${value}"/>`;
        newField = newField.children[0];
        this.form.appendChild(newField);
    }

    deleteValue(container_path, id) {
        const updates = {_id: this.object._id};
        const removal_ids = {};
        removal_ids[`-=${id}`] = null;
        updates[container_path] = removal_ids;
        this.object.update(updates);
    }


    /** @override */
	static get defaultOptions() {
	    return mergeObject(super.defaultOptions, {
			classes: ["lightbearer", "sheet", "item"],
			template: "systems/lightbearer/html/item-sheet.html",
			width: 520,
			height: 480,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "usage"}]
		});
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        return data;
    }

    /* -------------------------------------------- */

    /** @override */
	activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        html.find(".add-target-button").click(async ev => {
            const updates = {};
            updates[`data.targets._${randomID(16)}`] = {
                "type": "None",
                effects: {}
            };
            this.object.update(updates)
            await this._onSubmit(ev);
        });

        html.find(".remove-target-button").click(async ev => {
            const target = ev.target.closest(".target");
            this.deleteValue("data.targets", target.dataset.key);
            target.parentElement.removeChild(target);
            await this._onSubmit(ev);
        });

        html.find(".add-effect-button").click(async ev => {
            const target = ev.target.closest(".target");
            const updates = {};
            updates[`data.targets.${target.dataset.key}.effects._${randomID(16)}`] = {
                "type": "Text"
            };
            this.object.update(updates)
            await this._onSubmit(ev);
        });

        html.find(".remove-effect-button").click(async ev => {
            const effectList = ev.target.closest(".effect-list");
            const effect = ev.target.closest(".effect");
            this.deleteValue(
                `data.targets.${effectList.dataset.key}.effects`,
                effect.dataset.key
            );
            effect.parentElement.removeChild(effect);
            await this._onSubmit(ev);
        });
    }

    /* -------------------------------------------- */

    /** @override */
    /*
    _updateObject(event, formData) {
        return this.object.update(formData);
    }
    */

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["lightbearer", "sheet", "item"],
            template: "systems/lightbearer/html/item-sheet.html",
            width: 520,
            height: 480,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description_tab"}]
        });
    }
}

/**
 * Extensible item sheet.
 * @extends {ItemSheet}
 */
export class LightbearerItemSheet extends ItemSheet {

    /** @override */
	static get defaultOptions() {
	    return mergeObject(super.defaultOptions, {
			classes: ["lightbearer", "sheet", "item"],
			template: "systems/lightbearer/templates/item-sheet.html",
			width: 520,
			height: 480,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
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

        // Add or Remove Attribute
        html.find(".template").on("click", ".template-control", this._onClickAttributeControl.bind(this));
    }

    /* -------------------------------------------- */

    /**
     * Listen for click events on an attribute control to modify the composition of attributes in the sheet
     * @param {MouseEvent} event        The originating left click event
     * @private
     */
    async _onClickAttributeControl(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const action = button.dataset.action;
        const template = this.object.data.data.template;
        const form = this.form;

        // Add new attribute
        if ( action === "create" ) {
            let newFieldId = "_" + randomID(16);
            let newField = document.createElement("div");
            newField.innerHTML = `<input type="text" name="data.template.${newFieldId}.label" value="Item"/>`;
            newField = newField.children[0];
            form.appendChild(newField);
            await this._onSubmit(event);
        }

        // Remove existing attribute
        else if ( action === "delete" ) {
            const li = button.closest(".template");
            li.parentElement.removeChild(li);
            await this._onSubmit(event);
        }
    }

    /* -------------------------------------------- */

    /** @override */
    _updateObject(event, formData) {
        const expanded = expandObject(formData);

        // If no template exists, fallback to standard behaviour
        if (!expanded.data || !expanded.data.template)
        {
            return super._updateObject(event, formData);
        }

        // Remove attributes which are no longer used
        const template = expanded.data.template;
        for ( let k of Object.keys(this.object.data.data.template) ) {
          if ( !template.hasOwnProperty(k) ) template[`-=${k}`] = null;
        }

        // Create new update object
        let updatedData = {_id: this.object._id, "data.template": template};
        for (let [key, value] of Object.entries(formData).filter(e => !e[0].startsWith("data.template")))
        {
            if (!key.startsWith("data.template"))
            {
                updatedData[key] = value;
            }
        }

        // Update the Item
        return this.object.update(updatedData);
    }
}

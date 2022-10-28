/**
 * Extensible item sheet.
 * @extends {ItemSheet}
 */
export class LightbearerItemSheet extends ItemSheet {

    storeValue(path, value) {
        if (!value) {
            value = "";
        }
        let newFieldId = "_" + randomID(16);
        let newField = document.createElement("div");
        newField.innerHTML = `<input class="invisible" type="text" name="${path.replace('$id', newFieldId)}" value="${value}"/>`;
        newField = newField.children[0];
        this.form.appendChild(newField);
    }

    deleteValue(container_path, id) {
        const updates = { _id: this.object.id };
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
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        return data;
    }

    /* -------------------------------------------- */

    async swapTargets(targetKey, otherKey) {
        if (!targetKey || !otherKey)
            return;

        const keyPath = `system.targets.${targetKey}`;
        const otherPath = `system.targets.${otherKey}`;

        const targets = this.item.system.targets;
        const updates = {};

        for (const [k, v] of Object.entries(targets[targetKey])) {
            if (k == "effects") continue;
            updates[`${otherPath}.${k}`] = v;
        }
        for (const [k, v] of Object.entries(targets[otherKey])) {
            if (k == "effects") continue;
            updates[`${keyPath}.${k}`] = v;
        }

        for (const [k, v] of Object.entries(targets[targetKey].effects)) {
            if (!k || v == null) continue;
            updates[`${otherPath}.effects.${k}`] = v;
            updates[`${keyPath}.effects.-=${k}`] = null;
        }
        for (const [k, v] of Object.entries(targets[otherKey].effects)) {
            if (!k || v == null) continue;
            updates[`${keyPath}.effects.${k}`] = v;
            updates[`${otherPath}.effects.-=${k}`] = null;
        }

        this.object.update(updates);
    }

    async swapEffects(targetKey, effectKey, otherKey) {
        if (!targetKey || !effectKey || !otherKey)
            return;

        const keyPath = `system.targets.${targetKey}.effects.${effectKey}`;
        const otherPath = `system.targets.${targetKey}.effects.${otherKey}`;

        const effects = this.item.system.targets[targetKey].effects;
        const updates = {};

        for (const [k, v] of Object.entries(effects[effectKey])) {
            updates[`${otherPath}.${k}`] = v;
        }
        for (const [k, v] of Object.entries(effects[otherKey])) {
            updates[`${keyPath}.${k}`] = v;
        }

        this.object.update(updates);
    }


    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        html.find(".add-target-button").click(async ev => {
            const updates = {};
            updates[`system.targets._${randomID(16)}`] = {
                "type": "None",
                "includeSelf": false,
                effects: {}
            };
            this.object.update(updates)
        });


        html.find(".target-up").click(async ev => {
            const target = $(ev.target.closest(".target"));
            const targetKey = target.data("key");
            const otherKey = target.prev().prev().data("key");

            await this.swapTargets(targetKey, otherKey);
        });

        html.find(".target-down").click(async ev => {
            const target = $(ev.target.closest(".target"));
            const targetKey = target.data("key");
            const otherKey = target.next().next().data("key");

            await this.swapTargets(targetKey, otherKey);
        });

        html.find(".effect-up").click(async ev => {
            const effectList = $(ev.target.closest(".effect-list"));
            const effect = $(ev.target.closest(".effect"));
            const targetKey = effectList.data("parentKey");
            const effectKey = effect.data("key");
            const otherKey = effect.prev().data("key");

            await this.swapEffects(targetKey, effectKey, otherKey);
        });

        html.find(".effect-down").click(async ev => {
            const effectList = $(ev.target.closest(".effect-list"));
            const effect = $(ev.target.closest(".effect"));
            const targetKey = effectList.data("parentKey");
            const effectKey = effect.data("key");
            const otherKey = effect.next().data("key");

            await this.swapEffects(targetKey, effectKey, otherKey);
        });

        html.find(".remove-target-button").click(async ev => {
            const target = ev.target.closest(".target");
            this.deleteValue("system.targets", target.dataset.key);
        });

        html.find(".add-effect-button").click(async ev => {
            const target = ev.target.closest(".target");
            const updates = {};
            updates[`system.targets.${target.dataset.key}.effects._${randomID(16)}`] = {
                "type": "Text"
            };
            this.object.update(updates)
        });

        html.find(".remove-effect-button").click(async ev => {
            const effectList = ev.target.closest(".effect-list");
            const effect = ev.target.closest(".effect");
            this.deleteValue(
                `system.targets.${effectList.dataset.parentKey}.effects`,
                effect.dataset.key
            );
        });
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["lightbearer", "sheet", "item"],
            template: "systems/lightbearer/html/item-sheet.html",
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description_tab" }]
        });
    }
}

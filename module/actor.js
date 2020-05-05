import { ChatTemplate, ErrorMessage } from "./chat.js";

const ATTRIBUTES = ["agility", "endurance", "power", "charisma", "memory", "perception"];
const STATS = ["physique", "cunning", "total"];
const SKILLS = ["artifice", "melee", "ranged", "smithing", "stealth"];

/**
 * Base Actor class
 * @extends {Actor}
 */
export class LightbearerActor extends Actor {

    /** @override */
    getRollData() {
        const data = super.getRollData();
        data['health'] = data.health.value;
        data['maxHealth'] = data.health.max;
        data['hp'] = data.health.value;
        data['maxHp'] = data.health.max;
        data['energy'] = data.energy.value;
        data['maxEnergy'] = data.energy.max;
        data['actions'] = data.actions.value;
        data['maxActions'] = data.actions.max;
        data['reactions'] = data.reactions.value;
        data['maxReactions'] = data.reactions.max;
        for (let attribute of ATTRIBUTES)
        {
            data[attribute] = data.attributes[attribute].value;
        }
        for (let stat of STATS)
        {
            data[stat] = data.stats[stat].value;
        }
        for (let skill of SKILLS)
        {
            data[skill] = data.skills[skill].value;
        }
        return data;
    }

    /** @override */
    prepareData() {
        // Retrieve data
        super.prepareData();
        const actorData = this.data;
        const data = actorData.data;

        // Skip non-character actors
        if (actorData.type !== "character")
            return;

        // Set derived attributes
        data.stats.physique.value = Math.round((
            Number(data.attributes.agility.value)
            + Number(data.attributes.endurance.value)
            + Number(data.attributes.power.value)
        ) / 3);
        data.stats.cunning.value = Math.round((
            Number(data.attributes.charisma.value)
            + Number(data.attributes.memory.value)
            + Number(data.attributes.perception.value)
        ) / 3);
        data.stats.total.value = (
            Number(data.attributes.agility.value)
            + Number(data.attributes.endurance.value)
            + Number(data.attributes.power.value)
            + Number(data.attributes.charisma.value)
            + Number(data.attributes.memory.value)
            + Number(data.attributes.perception.value)
        );
    }

    // Public extensions
    get player() {
        if (this.isPC)
        {
            return game.users.get(Object.keys(this.data.permission).find(p => p !== "default"));
        }
        else
        {
            return game.lightbearer.gm;
        }
    }

    sendTemplate(template, buttons) {
        new ChatTemplate(this, template, buttons).send()
    }

    // Actor Defaults
    async setDefaults(uid) {
        // Make sure only the GM sets values
        if (!game.user.isGM) return;
        const user = game.users.get(uid);
        console.log("New Character by " + user.name);

        // Wait for the sheet to compile
        await new Promise(resolve => setTimeout(resolve, 500));

        // Set player defaults
        if (this.isPC)
        {
            let permissions = {'default': ENTITY_PERMISSIONS.LIMITED};
            permissions[user.id] = ENTITY_PERMISSIONS.OWNER;
            this.update({
                "permissions": permissions,
                "name": `${user.name}`,
                "token.name": `${user.name}`,
                "token.actorLink": true,
                "token.displayBars": TOKEN_DISPLAY_MODES.HOVER,
                "token.displayName": TOKEN_DISPLAY_MODES.HOVER,
                "token.disposition": TOKEN_DISPOSITIONS.FRIENDLY,
                "token.dimLight": 30,
                "token.brightLight": 15,
                "token.vision": true,
                "token.bar1": {"attribute": "health"},
                "token.bar2": {"attribute": "reactions"},
                "img": "Players/default_image.svg",
                "token.img": "Players/default_image.svg"
            });
        }
        // Set npc defaults
        else
        {
            this.update({
                "permissions.default": ENTITY_PERMISSIONS.NONE,
                "name": "New Character",
                "token.name": "New Character",
                "token.actorLink": false,
                "token.displayBars": TOKEN_DISPLAY_MODES.OWNER_HOVER,
                "token.displayName": TOKEN_DISPLAY_MODES.HOVER,
                "token.disposition": TOKEN_DISPOSITIONS.FRIENDLY,
                "token.bar1": {"attribute": "health"},
                "token.bar2": {"attribute": "reactions"},
                "img": "Entities/default_image.svg",
                "token.img": "Entities/default_image.svg"
            });
        }
    }

    // Called when a new round begins
    startRound(combat) {
        const actorData = this.data
        const data = actorData.data;

        if (actorData.type !== "character")
            return;

        this.update({"data.actions.previous": data.actions.value});
        this.update({"data.reactions.previous": data.reactions.value});
        this.update({"data.actions.value": data.actions.max});
        this.update({"data.reactions.value": data.reactions.max});

        this.items.forEach(item => item.update({"data.cooldown": false}));
    }

    // Called when a round is reset
    undoRound(combat) {
        const actorData = this.data
        const data = actorData.data;

        if (actorData.type !== "character")
            return;

        this.update({"data.actions.value": data.actions.previous});
        this.update({"data.reactions.value": data.reactions.previous});
    }

    useAction() {
        let actions = this.data.data.actions.value;
        if (actions <= 0) {
            ErrorMessage("Not enough actions.");
        }
        else {
            this.update({"data.actions.value": actions - 1})
        }
    }

    useReaction() {
        let reactions = this.data.data.reactions.value;
        if (reactions <= 0) {
            ErrorMessage("Not enough reactions.");
        }
        else {
            this.update({"data.reactions.value": reactions - 1})
        }
    }
}

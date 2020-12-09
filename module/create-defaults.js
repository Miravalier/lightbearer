export function preCreateItem(data, options, userId)
{
    if (data.type == "Active Ability")
    {
        data.img = "systems/lightbearer/resources/unknown-active.png";
    }
    else if (data.type == "Consumable")
    {
        data.img = "systems/lightbearer/resources/unknown-consumable.png";
    }
    else if (data.type == "Passive Ability")
    {
        data.img = "systems/lightbearer/resources/unknown-passive.png";
    }
    else
    {
        data.img = "systems/lightbearer/resources/unknown-misc.png";
    }
    data.permission = {'default': ENTITY_PERMISSIONS.LIMITED};
}

export function preCreateOwnedItem(actor, data, options, userId)
{
    if (!data.img)
    {
        if (data.type == "Active Ability")
        {
            data.img = "systems/lightbearer/resources/unknown-active.png";
        }
        else if (data.type == "Consumable")
        {
            data.img = "systems/lightbearer/resources/unknown-consumable.png";
        }
        else if (data.type == "Passive Ability")
        {
            data.img = "systems/lightbearer/resources/unknown-passive.png";
        }
        else
        {
            data.img = "systems/lightbearer/resources/unknown-misc.png";
        }
    }
}

export function preCreateActor(data, options, userId)
{
    data.img = "Players/default_image.svg";
    if (data.type === "Character")
    {
        console.log(data);
        data.permission = {'default': ENTITY_PERMISSIONS.LIMITED};
    }
}

export function preCreateToken(scene, data, options, userId)
{
    const actor = game.actors.get(data.actorId);

    data.name = actor.name;
    data.img = actor.img;
    data.bar1 = {attribute: "hp"};
    if (actor.data.data.mana.max)
    {
        data.bar2 = {attribute: "mana"};
    }

    if (actor.data.type === "Character")
    {
        data.actorLink = true;
        data.displayBars = TOKEN_DISPLAY_MODES.ALWAYS;
        data.displayName = TOKEN_DISPLAY_MODES.HOVER;
        data.disposition = TOKEN_DISPOSITIONS.FRIENDLY;
        data.vision = true;

        data.brightSight = 100;
        data.dimSight = 100;
    }
    else if (actor.data.type === "NPC")
    {
        data.actorLink = false;
        data.displayBars = TOKEN_DISPLAY_MODES.OWNER;
        data.displayName = TOKEN_DISPLAY_MODES.HOVER;
        data.vision = false;
        if (actor.data.data.hp.formula)
        {
            const roll = new Roll(actor.data.data.hp.formula, actor.getRollData());
            roll.roll();
            data.actorData = {
                data: {
                    hp: {
                        value: roll.total,
                        max: roll.total
                    }
                }
            };
        }
    }

    let size = 1;
    switch (actor.data.data.size)
    {
        case 'Tiny':
        {
            size = 0.5;
        }
        break;
        case 'Large':
        {
            size = 2;
        }
        break;
        case 'Huge':
        {
            size = 3;
        }
        break;
        case 'Gargantuan':
        {
            size = 4;
        }
        break;
    }
    data.width = size;
    data.height = size;
}

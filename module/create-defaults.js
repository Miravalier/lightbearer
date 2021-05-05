export function preCreateItem(data, options, userId)
{
    if (data.type === "Ability")
    {
        data.img = "systems/lightbearer/resources/unknown-active.png";
    }
    else if (data.type === "Item")
    {
        data.img = "systems/lightbearer/resources/unknown-weapon.png";
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
        if (data.type === "Ability")
        {
            data.img = "systems/lightbearer/resources/unknown-active.png";
        }
        else if (data.type === "Item")
        {
            data.img = "systems/lightbearer/resources/unknown-weapon.png";
        }
        else
        {
            data.img = "systems/lightbearer/resources/unknown-misc.png";
        }
    }
}

export function preCreateActor(data, options, userId)
{
    if (!data.img)
    {
        data.img = `Players/${game.user.name}/default_image.svg`;
    }
    if (userId !== game.lightbearer.gm.id)
    {
        data.permission = {'default': ENTITY_PERMISSIONS.LIMITED};
    }
}

export function preCreateToken(scene, data, options, userId)
{
    const actor = game.actors.get(data.actorId);

    data.name = actor.name;
    data.img = actor.img;
    data.bar1 = {attribute: "health"};
    data.bar2 = {attribute: "armor"};

    if (actor.data.data.category !== "npc")
    {
        data.actorLink = true;
    }
    else
    {
        data.actorLink = false;
        if (actor.data.data.health.formula)
        {
            const roll = new Roll(actor.data.data.health.formula, actor.getRollData());
            roll.roll();
            data.actorData = {
                data: {
                    health: {
                        value: roll.total,
                        max: roll.total
                    }
                }
            };
        }
    }

    if (actor.hasPlayerOwner)
    {
        data.displayBars = TOKEN_DISPLAY_MODES.ALWAYS;
        data.displayName = TOKEN_DISPLAY_MODES.HOVER;
        data.disposition = TOKEN_DISPOSITIONS.FRIENDLY;
        data.vision = true;
        data.brightSight = 100;
        data.dimSight = 100;
    }
    else
    {
        data.displayBars = TOKEN_DISPLAY_MODES.OWNER;
        data.displayName = TOKEN_DISPLAY_MODES.HOVER;
        data.disposition = TOKEN_DISPOSITIONS.HOSTILE;
        data.vision = false;
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

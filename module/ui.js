import { distance, closer, farther } from "./points.js";

export async function createTemplate(data)
{
    if (data === undefined) data = {};
    if (data.position === undefined) data.position = {x: 0, y: 0};
    if (data.position.x === undefined) data.position.x = 0;
    if (data.position.y === undefined) data.position.y = 0;
    if (data.shape === undefined) data.shape = 'circle';
    if (data.length === undefined) data.length = 15;
    if (data.color === undefined) data.color = game.user.color;
    if (data.angle === undefined) data.angle = 100;
    if (data.direction === undefined) data.direction = 0;
    if (data.width === undefined) data.width = 5;
    if (data.offset === undefined) data.offset = {x: 0, y: 0};
    if (data.offset.x === undefined) data.offset.x = 0;
    if (data.offset.y === undefined) data.offset.y = 0;

    const scene = game.scenes.get(game.user.viewedScene);
    return await scene.createEmbeddedEntity("MeasuredTemplate", {
        t: data.shape,
        user: game.user.id,
        x: data.position.x + 50 + data.offset.x,
        y: data.position.y + 50 + data.offset.y,
        angle: data.angle,
        width: data.width,
        distance: data.length,
        direction: data.direction,
        borderColor: "#000000",
        fillColor: data.color,
        texture: data.texture,
    });
}

export async function selectGroup(prompt)
{
    if (!prompt) prompt = "Select any number of tokens, then click the board.";
    game.uitools.hoveredToken = null;
    const selectedTokens = new Set();

    document.body.style.cursor = "crosshair";
    ui.notifications.info(prompt);
    while (true) {
        const token = await new Promise(resolve => {
            Hooks.once("clickToken", resolve);
        });
        if (token) {
            if (selectedTokens.has(token))
            {
                selectedTokens.delete(token);
                token.targeted.delete(game.user);
                token.refresh();
            }
            else
            {
                selectedTokens.add(token);
                token.targeted.add(game.user);
                token.refresh();
            }
        }
        else {
            break;
        }
    }
    document.body.style.cursor = "";

    selectedTokens.forEach(token => {
        token.setTarget(false);
        token.refresh();
    });
    return Array.from(selectedTokens);
}


export async function selectCreature(prompt)
{
    if (!prompt) prompt = "Click on a token, or click the board to cancel.";
    document.body.style.cursor = "crosshair";
    ui.notifications.info(prompt);
    const token = await new Promise(resolve => {
        Hooks.once("clickToken", resolve);
    });
    document.body.style.cursor = "";
    return token;
}


export async function selectPosition(prompt)
{
    if (!prompt) prompt = "Click on a square.";
    document.body.style.cursor = "crosshair";
    ui.notifications.info(prompt);
    const pos = await new Promise(resolve => {
        Hooks.once("clickBoard", resolve);
    });
    document.body.style.cursor = "";
    return pos;
}


export async function selectFixedShape(data)
{
    if (data.length === undefined) data.length = 15;
    if (data.color === undefined) data.color = game.user.color;
    if (data.offset === undefined) data.offset = {x: 0, y: 0};
    if (data.offset.x === undefined) data.offset.x = 0;
    if (data.offset.y === undefined) data.offset.y = 0;
    if (data.origin === undefined) {
        data.fixed = false;
        data.position = {x: 0, y: 0}
    }
    else {
        data.fixed = true;
        data.position = {x: data.origin.x, y: data.origin.y};
    }
    data.position.x += data.offset.x + 50;
    data.position.y += data.offset.y + 50;
    
    // Find the current scene
    const scene = game.scenes.get(game.user.viewedScene);

    // Create shape template
    const template = await scene.createEmbeddedEntity("MeasuredTemplate", {
        t: data.shape,
        user: game.user.id,
        x: data.position.x,
        y: data.position.y,
        angle: 360,
        distance: data.length,
        width: data.width,
        direction: 0,
        borderColor: "#000000",
        fillColor: data.color,
    });

    // Start moving the shape to the mouse periodically
    let moveInterval;
    if (!data.fixed) {
        const mouse = canvas.app.renderer.plugins.interaction.mouse;
        moveInterval = setInterval(function() {
            const mousePosition = mouse.getLocalPosition(canvas.app.stage);
            mousePosition.x += data.offset.x;
            mousePosition.y += data.offset.y;
            moveTemplateToPosition(scene, template, mousePosition);
        }, 50);
    }

    // Wait for user to click, locking in their shape selection
    document.body.style.cursor = "crosshair";
    const position = await new Promise(resolve => {
        Hooks.once("clickBoard", resolve);
    });
    document.body.style.cursor = "";

    // Stop moving the shape template
    if (!data.fixed) {
        clearInterval(moveInterval);
    }

    // Get all combatants under the template
    const selected = getTokensUnderTemplate(scene, template);

    // Delete template
    await scene.deleteEmbeddedEntity("MeasuredTemplate", template._id);

    // Return the position and the tokens under the drawn template
    if (data.fixed) {
        return {position: data.position, tokens: selected};
    }
    else {
        return {position: position, tokens: selected};
    }
}


export async function selectShape(data)
{
    // Get default parameters set up
    if (data.shape == "cone" && data.angle == undefined) data.angle = 100;
    if (data.shape == "ray" && data.width == undefined) data.width = 5;
    if (data.length == undefined) data.length = 15;
    if (data.color == undefined) data.color = game.user.color;
    if (data.origin == undefined) {
        data.position = await selectPosition(`Place the ${data.shape}'s origin.`);
    }
    else {
        data.position = {x: data.origin.x, y: data.origin.y};
    }
    data.position.x += 50;
    data.position.y += 50;
    data.direction = 0;

    // Find the current scene
    const scene = game.scenes.get(game.user.viewedScene);

    // Create shape template
    const template = await scene.createEmbeddedEntity("MeasuredTemplate", {
        t: data.shape,
        user: game.user.id,
        x: data.position.x,
        y: data.position.y,
        angle: data.angle,
        distance: data.length,
        width: data.width,
        direction: 0,
        borderColor: "#000000",
        fillColor: data.color,
    });

    // Start rotating the shape toward the mouse periodically
    const mouse = canvas.app.renderer.plugins.interaction.mouse;
    const rotateInterval = setInterval(async function() {
        const mousePosition = mouse.getLocalPosition(canvas.app.stage);
        data.direction = await rotateTemplateToFace(scene, template, mousePosition);
    }, 50);

    // Wait for user to click, locking in their shape selection
    document.body.style.cursor = "crosshair";
    const position = await new Promise(resolve => {
        Hooks.once("clickBoard", resolve);
    });
    document.body.style.cursor = "";

    // Stop rotating the shape template
    clearInterval(rotateInterval);

    // Get all combatants under the template
    const selected = getTokensUnderTemplate(scene, template);

    // Delete template
    await scene.deleteEmbeddedEntity("MeasuredTemplate", template._id);

    // Return the tokens under the drawn template
    return {position: data.position, tokens: selected, direction: data.direction};
}


function onHoverToken(token, selected)
{
    if (selected)
    {
        game.uitools.hoveredToken = token;
    }
    else
    {
        if (game.uitools.hoveredToken === token)
        {
            game.uitools.hoveredToken = null;
        }
    }
}


export function getTokensAtPosition(position)
{
        if (game.combat)
        {
            return game.combat.combatants.filter(combatant => {
                return distance(template, {x: combatant.token.x + 50, y: combatant.token.y + 50}) <= template.distance * 20;
            });
        }
        else
        {
            const scene = game.scenes.get(game.user.viewedScene);
            return scene.getEmbeddedCollection("Token").filter(token => {
                return distance(template, {x: token.x + 50, y: token.y + 50}) <= template.distance * 20;
                return (
                    Math.floor(token.x / 100) * 100 == position.x
                    &&
                    Math.floor(token.y / 100) * 100 == position.y
                )
            });
        }
}


export function getTokensUnderTemplate(scene, template)
{
    if (template.t == "circle")
    {
        if (game.combat)
        {
            return game.combat.combatants.filter(combatant => {
                if (!combatant.token) {
                    return false;
                }
                const value = distance(template, {x: combatant.token.x + 50, y: combatant.token.y + 50});
                return value <= (template.distance * 20);
            });
        }
        else
        {
            return scene.getEmbeddedCollection("Token").filter(token => {
                return distance(template, {x: token.x + 50, y: token.y + 50}) <= template.distance * 20;
            });
        }
    }

    const bounds = canvas.templates.get(template._id).shape;
    if (game.combat)
    {
        return game.combat.combatants.filter(combatant => {
            if (!combatant.token) {
                return false;
            }
            return bounds.contains(
                combatant.token.x + 50 - template.x,
                combatant.token.y + 50 - template.y
            );
        });
    }
    else
    {
        return scene.getEmbeddedCollection("Token").filter(token => {
            return bounds.contains(
                token.x + 50 - template.x,
                token.y + 50 - template.y
            );
        });
    }
}


async function moveTemplateToPosition(scene, template, point)
{
    await scene.updateEmbeddedEntity("MeasuredTemplate", {
        _id: template._id,
        x: point.x,
        y: point.y
    });
}


async function rotateTemplateToFace(scene, template, point)
{
    const rotation = Math.atan2(point.y - template.y, point.x - template.x) * 180 / Math.PI;
    await scene.updateEmbeddedEntity("MeasuredTemplate", {
        _id: template._id,
        direction: rotation
    });
    return rotation;
}


Hooks.once("init", () => {
    game.uitools = {
        hoveredToken: null
    };
});


Hooks.once("ready", () => {
    Hooks.on("hoverToken",  onHoverToken);
});

Hooks.on("canvasReady", (canvas) => {
    canvas.app.stage.addListener('click', ev => {
        const pos = ev.data.getLocalPosition(canvas.app.stage);
        pos.x = Math.floor(pos.x / 100) * 100;
        pos.y = Math.floor(pos.y / 100) * 100;

        Hooks.call("clickBoard", pos);

        if (game.uitools.hoveredToken)
        {
            Hooks.call("clickToken", game.uitools.hoveredToken);
        }
        else
        {
            Hooks.call("clickToken", null);
        }
    });
});

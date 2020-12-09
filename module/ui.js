import { distance, closer, farther } from "./points.js";

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
    return selectedTokens;
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


export async function selectSquare(prompt)
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


export async function selectCone(length, angle, color)
{
    return await selectShape({shape: "cone", angle: angle, color: color});
}


export async function selectRay(length, width, color)
{
    return await selectShape({shape: "ray", width: width, color: color});
}


export async function selectCircle(radius, color)
{
    return await selectFixedShape({shape: "circle", length: radius, color: color});
}


export async function selectFixedShape(data)
{
    if (!data.length) data.length = 15;
    if (!data.color) data.color = game.user.color;
    
    // Find the current scene
    const scene = game.scenes.get(game.user.viewedScene);

    // Create shape template
    const template = await scene.createEmbeddedEntity("MeasuredTemplate", {
        t: data.shape,
        user: game.user.id,
        x: 50,
        y: 50,
        angle: 360,
        distance: data.length,
        direction: 0,
        borderColor: "#000000",
        fillColor: data.color,
    });

    // Start moving the shape to the mouse periodically
    const mouse = canvas.app.renderer.plugins.interaction.mouse;
    const moveInterval = setInterval(function() {
        const mousePosition = mouse.getLocalPosition(canvas.app.stage);
        moveTemplateToPosition(scene, template, mousePosition);
    }, 100);

    // Wait for user to click, locking in their shape selection
    document.body.style.cursor = "crosshair";
    await new Promise(resolve => {
        Hooks.once("clickBoard", resolve);
    });
    document.body.style.cursor = "";

    // Stop moving the shape template
    clearInterval(moveInterval);

    // Get all combatants under the template
    const selected = getTokensUnderTemplate(scene, template);

    // Delete template
    await scene.deleteEmbeddedEntity("MeasuredTemplate", template._id);

    // Return the tokens under the drawn template
    return selected;
}


export async function selectShape(data)
{
    // Get default parameters set up
    if (data.shape == "cone" && !data.angle) data.angle = 100;
    if (data.shape == "ray" && !data.width) data.width = 5;
    if (!data.length) data.length = 15;
    if (!data.color) data.color = game.user.color;

    // Find the current scene
    const scene = game.scenes.get(game.user.viewedScene);

    // Find shape origin
    const origin = await selectSquare(`Place the ${data.shape}'s origin.`);
    origin.x += 50;
    origin.y += 50;

    // Create shape template
    const template = await scene.createEmbeddedEntity("MeasuredTemplate", {
        t: data.shape,
        user: game.user.id,
        x: origin.x,
        y: origin.y,
        angle: data.angle,
        distance: data.length,
        width: data.width,
        direction: 0,
        borderColor: "#000000",
        fillColor: data.color,
    });

    // Start rotating the shape toward the mouse periodically
    const mouse = canvas.app.renderer.plugins.interaction.mouse;
    const rotateInterval = setInterval(function() {
        const mousePosition = mouse.getLocalPosition(canvas.app.stage);
        rotateTemplateToFace(scene, template, mousePosition);
    }, 50);

    // Wait for user to click, locking in their shape selection
    document.body.style.cursor = "crosshair";
    await new Promise(resolve => {
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
    return selected;
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


async function getTokensUnderTemplate(scene, template)
{
    if (template.t == "circle")
    {
        if (game.combat)
        {
            return game.combat.combatants.filter(combatant => {
                return distance(template, {x: combatant.token.x + 50, y: combatant.token.y + 50}) <= template.distance * 20;
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
    await scene.updateEmbeddedEntity("MeasuredTemplate", {
        _id: template._id,
        direction: Math.atan2(point.y - template.y, point.x - template.x) * 180 / Math.PI
    });
}


Hooks.once("init", () => {
    game.uitools = {
        hoveredToken: null
    };
});


Hooks.once("ready", () => {
    Hooks.on("hoverToken",  onHoverToken);
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

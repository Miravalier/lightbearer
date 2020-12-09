import { distance, closer, farther } from "./points.js";
import * as chat from "./chat.js";

function nodeToKey(node)
{
    return node.x + "," + node.y;
}

function pointEq(src, dst)
{
    return src.x == dst.x && src.y == dst.y;
}

function occupied(node)
{
    return game.combat.combatants.find(combatant => {
        return combatant.token.x == node.x && combatant.token.y == node.y;
    });
}

export function checkCollision(source, destination)
{
    return canvas.walls.checkCollision(new Ray(
        {x: source.x + 50, y: source.y + 50},
        {x: destination.x + 50, y: destination.y + 50}
    ));
}

const adjacencies = [[-1, 0], [1, 0], [0, 1], [0, -1]]

export function findPath(source, destination, maxDistance, maxDepth)
{
    if (!maxDepth) maxDepth = 25;
    source = {
        x: Math.round(source.x / 100) * 100,
        y: Math.round(source.y / 100) * 100
    }
    destination = {
        x: Math.round(destination.x / 100) * 100,
        y: Math.round(destination.y / 100) * 100
    }

    const previousNodes = {};
    previousNodes[nodeToKey(source)] = true;
    let currentNodes = [source];
    let depth = 0;
    let closestNode = source;
    // While there are nodes to check and depth is not exceeded
    outerLoop: while (currentNodes && depth++ < maxDepth)
    {
        const nextNodes = [];
        for (let node of currentNodes)
        {
            // Check if this node is better than the previous best
            closestNode = closer(closestNode, node, destination);
            // Check if we've reached the destination
            if (node.x == destination.x && node.y == destination.y)
            {
                break outerLoop;
            }
            // Check all neighbors for pathability
            const neighbors = [
                {x: node.x + 100, y: node.y},
                {x: node.x - 100, y: node.y},
                {x: node.x, y: node.y + 100},
                {x: node.x, y: node.y - 100}
            ];
            for (const neighbor of neighbors)
            {
                // If this node has not been visited, isn't blocked by wall,
                // and isn't occupied.
                if (!previousNodes[nodeToKey(neighbor)]
                    && !checkCollision(node, neighbor)
                    && !occupied(neighbor))
                {
                    // The neighbor's previous is the current
                    previousNodes[nodeToKey(neighbor)] = node;
                    // Add the neighbor to next run of nodes
                    nextNodes.push(neighbor);
                }
            }
        }
        currentNodes = nextNodes;
    }

    // Walk backward from here to the start
    let path = [closestNode];
    let node = closestNode;
    while (!pointEq(node, source))
    {
        path.unshift(previousNodes[nodeToKey(node)]);
        node = previousNodes[nodeToKey(node)];
    }

    // Limit the path to the maxDistance
    if (maxDistance)
    {
        let distanceTraveled = 0;
        for (let i=1; i < path.length; i++)
        {
            distanceTraveled += distance(path[i - 1], path[i]);
            if (distanceTraveled > maxDistance) {
                path.splice(i, path.length - i);
            }
        }
    }
    // Simplify the path
    for (let i=0; i < path.length - 2;)
    {
        if (!checkCollision(path[i], path[i+2]))
        {
            path.splice(i+1, 1);
        }
        else
        {
            i++;
        }
    }
    // Return the path
    return path;
}

export function autoMove(actorId, tokenId, criterion)
{
    const currentActor = game.actors.get(actorId);
    const currentToken = currentActor.getActiveTokens().find(token => token.id == tokenId);
    if (!currentActor || !currentToken)
    {
		chat.ErrorMessage("Failed to resolve token or actor.");
        return;
    }

	// Find the nearest potential combatant
	const potentialCombatants = Array.from(game.combat.combatants.filter(criterion));
	let closestCombatant = null;
	let leastDistance = null;
	potentialCombatants.forEach(combatant => {
		const distance = (combatant.token.x - currentToken.x)**2 + (combatant.token.y - currentToken.y)**2;
		if (closestCombatant === null || distance < leastDistance) {
			closestCombatant = combatant;
			leastDistance = distance;
		}
	});
	if (closestCombatant === null)
	{
		chat.ErrorMessage("No combatants meet the given criterion.");
        return;
	}

    const path = findPath(currentToken, closestCombatant.token, currentActor.movementRange);

    // Update token's position
    currentToken.update({
    	x: path[path.length - 1].x,
    	y: path[path.length - 1].y
    });
}

export function autoAttack(actorId, itemCriterion, targetCriterion)
{
    const actor = game.actors.get(actorId);
	const options = Array.from(actor.getEmbeddedCollection("OwnedItem").filter(itemCriterion));
	const attack = actor.getOwnedItem(options[Math.floor(Math.random() * options.length)]._id);

	const potentialTargets = Array.from(game.combat.combatants.filter(targetCriterion));
	let target = null;
	let bestMetric = null;
	potentialCombatants.forEach(combatant => {
		const metric = (combatant.token.x - currentToken.x)**2 + (combatant.token.y - currentToken.y)**2;
		if (target === null || metric < bestMetric) {
            target = combatant;
            bestMetric = metric;
		}
	});
	if (target === null)
	{
		chat.ErrorMessage("No combatants meet the given criterion.");
        return;
	}

    attack.use(target);
}

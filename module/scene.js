function pointDistance(x1, y1, x2, y2)
{
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Base Scene class
 * @extends {Scene}
 */
export class LightbearerScene extends Scene {
    get playerTokens()
    {
        let tokens = [];
        for (let token of this.data.tokens)
        {
            // Verify this token is a player character
            if (!token.actorId) continue;
            if (!game.actors.get(token.actorId).isPC) continue;
            tokens.push(token);
        }
        return tokens;
    }

    onTokenUpdate(token)
    {
        // Only run on the GM's box
        if (!game.user.isGM) return;
        // Only run if TrackPlayerMovement is on for this scene
        if (!this.TrackPlayerMovement) return;

        // Get the previous x, y for this token
        if (token._id in game.lightbearer.locations)
        {
            let [previous_x, previous_y] = game.lightbearer.locations[token._id];
            game.lightbearer.distances[token._id] += pointDistance(previous_x, previous_y, token.x, token.y);
        }
        // Store the distance traveled as 0 if this is a new token
        else
        {
            game.lightbearer.distances[token._id] = 0;
        }

        // Store x, y for next call
        game.lightbearer.locations[token._id] = [token.x, token.y];

        // Update all token distance displays
        this.updateDistanceDisplays()
    }

    updateDistanceDisplays()
    {
        // Get tokens
        let tokens = this.playerTokens;

        // Calculate the minimum distance traveled
        let distance = null;
        for (let token of tokens)
        {
            let current_distance = game.lightbearer.distances[token._id];
            if (!current_distance)
            {
                current_distance = 0;
            }
            if (distance === null || current_distance < distance)
            {
                distance = current_distance;
            }
            game.lightbearer.distances[token._id] = current_distance;
        }
        
        // Update all tokens names based on their travel distance compared to
        // the minimum distance traveled
        for (let token of tokens)
        {
            let current_distance = game.lightbearer.distances[token._id] - distance;
            this.setTokenName(
                token,
                `📐 ${Math.round(current_distance / this.data.grid * this.data.gridDistance)} ${this.data.gridUnits}`
            );
            game.lightbearer.distances[token._id] = current_distance;
        }
    }


    get TrackPlayerMovement()
    {
        return game.lightbearer.TrackPlayerMovement;
    }

    set TrackPlayerMovement(value)
    {
        if (value)
        {
            console.log("Track Player Movement turned on.");
            for (let token of this.playerTokens)
            {
                game.lightbearer.locations[token._id] = [token.x, token.y];
                game.lightbearer.distances[token._id] = 0;
                this.setTokenName(token, `📐 0 ${this.data.gridUnits}`);
            }
            game.lightbearer.TrackPlayerMovement = true;
        }
        else
        {
            console.log("Track Player Movement turned off.");
            for (let token of this.playerTokens)
            {
                this.revertTokenName(token);
            }
            game.lightbearer.TrackPlayerMovement = false;
        }
    }

    setTokenName(token, name)
    {
        this.updateEmbeddedEntity("Token", {
            "name": name,
            "displayName": TOKEN_DISPLAY_MODES.ALWAYS,
            "_id": token._id
        });
    }

    revertTokenName(token)
    {
        let actor = game.actors.get(token.actorId);
        this.updateEmbeddedEntity("Token", {
            "name": game.actors.get(token.actorId).name,
            "displayName": TOKEN_DISPLAY_MODES.HOVER,
            "_id": token._id
        });
    }
}

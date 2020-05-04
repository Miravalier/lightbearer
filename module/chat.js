export function ErrorMessage(content)
{
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker(),
        content: `<div class="lightbearer error">${content}</div>`
    });
}

// Chat Message Creation Hook
export function onChatExport()
{
    let date = new Date().toDateString().replace(/\s/g, "-");
    let output = "<!DOCTYPE html>";

    // File header
    output += `<html>`;
    output += `<head>`;
    output += `<title>${date} Chat Log</title>`;
    output += `<link href="https://nonsense.page/systems/lightbearer/styles/lightbearer.css" rel="stylesheet" type="text/css">`;
    output += `<link href="https://nonsense.page/css/style.css" rel="stylesheet" type="text/css">`;
    output += `<style>`;
    output += `img {display: none}`;
    output += `</style>`;
    output += `</head>`;
    output += `<body>`;

    // Chat log header
    output += `<ol id="chat-log">`;

    // Chat log body
    for (let message of game.messages.entities)
    {
        output += `<li class="message flexcol">`;

        output += `<div class="message-header flexrow">`;
        output += `<h4 class="message-sender">${message.alias}</h4>`;
        output += `<span class="message-metadata">`;
        output += `<time class="message-timestamp">${new Date(message.data.timestamp)}</time>`;
        output += `</span>`;
        output += `</div>`;

        output += `<div class="message-content">`;
        output += message.data.content;
        output += `</div>`;

        output += `</li>`;
    }

    // Chat log footer
    output += `</ol>`;

    // File footer
    output += `</body>`;
    output += `</html>`;

    // Save file
    saveDataToFile(output, "text/html", `chat-log-${date}.html`);
}

export async function onCreateChatMessage(html, data)
{
    html.on('click', '.chat-template.caption', onChatTemplateCaptionClicked);
    html.on('click', '.chat-template.total', onChatTemplateTotalClicked);
}

async function onChatTemplateTotalClicked(event)
{
    event.preventDefault();
    let formula = $(event.currentTarget).siblings(".chat-template.formula");
    if (formula.css("display") === "none")
    {
        formula.css("display", "block");
    }
    else
    {
        formula.css("display", "none");
    }
}

// Called when the caption in a chat template is clicked
async function onChatTemplateCaptionClicked(event)
{
    // Get button from event
    event.preventDefault();
    const button = event.currentTarget;

    // Disable button in case of multiple clicks while loading
    button.disabled = true;

    // Render source sheet
    const source = JSON.parse(atob(button.dataset.source));
    if (source.type === "Actor")
    {
        game.actors.get(source.actorId).sheet.render(true);
    }
    else if (source.type === "Item")
    {
        game.items.get(source.itemId).sheet.render(true);
    }
    else if (source.type === "OwnedItem")
    {
        const actor = game.actors.get(source.actorId);
        actor.getOwnedItem(source.itemId).sheet.render(true);
    }
    else
    {
        throw ("Unrecognized chat template source " + source.type);
    }

    // Re-enable button
    button.disabled = false;
}


// ChatTemplate class, created with a source of any actor,
// item, or ability.
export class ChatTemplate {
    constructor(source, template, buttons) {
        this.source = source;
        if (source.entity === "Actor")
        {
            this.title = "";
            this.origin = source.name;
            this.description = "";
            this.template = {};
            this.buttons = {};
            this.ids = btoa(JSON.stringify({
                "type": "Actor",
                "actorId": source._id
            }));
            this.roll_data = source.getRollData();
        }
        else if (source.entity === "Item")
        {
            if (source.actor) {
                this.title = source.name;
                this.origin = source.actor.name;
                this.ids = btoa(JSON.stringify({
                    "type": "OwnedItem",
                    "actorId": source.actor._id,
                    "itemId": source._id
                }));
                this.roll_data = source.actor.getRollData();
            }
            else
            {
                this.title = "";
                this.origin = source.name;
                this.ids = btoa(JSON.stringify({
                    "type": "Item",
                    "itemId": source._id
                }));
                this.roll_data = {};
            }
            this.description = source.data.data.description;
            this.template = source.data.data.template;
            this.buttons = {};
        }
        else
        {
            throw "Invalid ChatTemplate source type.";
        }
        this.icon = source.img;
        if (typeof template !== 'undefined' && template !== null)
        {
            Object.assign(this.template, template);
        }
        if (typeof buttons !== 'undefined' && buttons !== null)
        {
            Object.assign(this.buttons, buttons);
        }
    }

    send(speaker) {
        if (typeof speaker === 'undefined' || speaker === null) {
            speaker = ChatMessage.getSpeaker();
        }
        ChatMessage.create({
            user: game.user._id,
            speaker: speaker,
            content: this.toString()
        });
    }

    toString() {
        let output = "";

        // Build Header
        output += `<div class="chat-template caption" data-source="${this.ids}">`;
        output += `<img src="${this.icon}" title="Roll Icon" width="36" height="36" />`;
        output += `<span>${this.title}</span>`;
        output += `<span>${this.origin}</span>`;
        output += '</div>';

        // Build Body
        if (this.description)
        {
            output += '<div class="chat-template description">';
            output += this.description;
            output += '</div>';
        }
        if (this.template)
        {
            output += '<div class="chat-template list">';
            for (let value of Object.values(this.template))
            {
                const roll = new Roll(value.roll, this.roll_data);
                roll.roll();
                output += '<div class="chat-template item">';
                    output += `<div class="chat-template label">${value.label}</div>`;
                    output += `<div class="chat-template roll">`;
                        output += `<div class="chat-template total">${Math.round(roll.total)}</div>`;
                        output += `<div class="chat-template formula">${value.roll}</div>`;
                    output += '</div>';
                output += '</div>';
            }
            output += '</div>';
        }

        return output;
    }
}

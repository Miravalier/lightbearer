function spongebobCase(s)
{
    let capital = true;
    return s.replace(/[a-z]/gi, letter => {
        capital = !capital;
        if (capital) return letter.toUpperCase();
        else return letter.toLowerCase();
    });
}

const NUMBER_WORDS = [
    "Zero", "One", "Two", "Three", "Four", "Five",
    "Six", "Seven", "Eight", "Nine", "Ten"
];
function numberToWords(x)
{
    if (x >= 0 && x <= 10) {
        return NUMBER_WORDS[x];
    }
    return x.toString();
}

function memoteCommand(args)
{
    let speaker = ChatMessage.getSpeaker();
    let alias = speaker.alias;
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer emote">
            <img class="inline-img" src="Players/GM/spongebob.png" width=36 height=36/>
            ${spongebobCase(alias)} ${spongebobCase(args)}
        </div>`
    });
}

function oocCommand(args)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer ooc">${args}</div>`
    });
}

function emoteCommand(args)
{
    let speaker = ChatMessage.getSpeaker();
    let alias = speaker.alias;
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer emote">${alias} ${args}</div>`
    });
}

function storyCommand(args)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer story">${args}</div>`
    });
}

function narrateCommand(args)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer narrate">${args}</div>`
    });
}

function UserLookup(name)
{
    let user = game.users.entities.find(u => (u.name === name || u.charname === name));
    if (user)
    {
        return user.id;
    }

    return null;
}

function helpCommand(args)
{
    SystemMessage(
        `
            <p><b>/?</b> display this help message</p>
            <p><b>/e</b> describe what your character is doing</p>
            <p><b>/o</b> speak out of character</p>
            <p><b>/n</b> like /e, but doesn't put your name at the front</p>
            <p><b>/w &lt;player&gt;</b> send a message to a specific player</p>
        `,
        "System"
    );
}

function sendRegularMessage(message)
{
    let speaker = ChatMessage.getSpeaker();
    let character = game.user.character;
    if (character)
    {
        speaker.alias = character.name;
    }
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: message
    });
}

const COMMANDS = {
    "e": emoteCommand,
    "m": emoteCommand,
    "em": emoteCommand,
    "emote": emoteCommand,
    "me": memoteCommand,
    "memote": memoteCommand,
    "o": oocCommand,
    "oc": oocCommand,
    "oo": oocCommand,
    "ooc": oocCommand,
    "n": narrateCommand,
    "narrate": narrateCommand,
    "narration": narrateCommand,
    "narate": narrateCommand,
    "naratte": narrateCommand,
    "desc": storyCommand,
    "d": storyCommand,
    "story": storyCommand,
    "s": storyCommand,
    "?": helpCommand,
    "help": helpCommand,
    "h": helpCommand,
    "w": whisperCommand,
    "whisper": whisperCommand
};

const WHISPER_PATTERN = /^\s*("[^"]*?"|[a-z0-9_-]+)\s*/i;
function whisperCommand(args)
{
    let target = null;
    let content = args.replace(WHISPER_PATTERN, (_, m) => {
        target = m;
        return "";
    });

    if (!target)
    {
        ErrorMessage("No whisper target specified.");
        return;
    }

    let targetId = UserLookup(target);
    if (!targetId)
    {
        ErrorMessage(`No user exists with the name ${target}.`);
        return;
    }

    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: content,
        whisper: [targetId]
    });
}

const CMD_PATTERN = /^\s*\/([a-z0-9?_-]+)\s*/i;
export function preChatMessage(chatLog, message, chatData)
{
    // Replace italics and bold
    message = message.replace(/\*\*\*([^*]+)\*\*\*/, (_, m) => {
        return `<span style="font-weight: bold; font-style: italic;">${m}</span>`;
    });
    message = message.replace(/\*\*([^*]+)\*\*/, (_, m) => {
        return `<span style="font-weight: bold;">${m}</span>`;
    });
    message = message.replace(/\*([^*]+)\*/, (_, m) => {
        return `<span style="font-style: italic;">${m}</span>`;
    });
    message = message.replace(/\:([0-9a-zA-Z_-]+)\:/, (_, m) => {
        let img = game.lightbearer.emoji[m];
        if (img)
        {
            return `<img class="lightbearer emoji" src="${img}" width=24 height=24/>`;
        }
        else
        {
            return `:${m}:`;
        }
    });

    // Check for a command pattern
    let command = null;
    message = message.replace(CMD_PATTERN, (_, m) => {
        command = m;
        return "";
    });
    if (command)
    {
        // Dispatch command
        const command_function = COMMANDS[command];
        if (command_function)
        {
            command_function(message);
            return false;
        }
        else
        {
            ErrorMessage(`Unknown command '${command}'.`, game.user.name);
            return false;
        }
    }

    // Send a regular chat message
    sendRegularMessage(message);
    return false;
}

export function RoundUpdateMessage(round, alias)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = alias;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer round-update">Round ${numberToWords(round)}</div>`
    });
}

export function TurnUpdateMessage(actor, alias)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = alias;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer turn-update"
            style="color: ${actor.player.data.color}; border: 2px solid ${actor.player.data.color};"
            >${actor.name}</div>`
    });
}

export function SystemMessage(content, source)
{
    let speaker = ChatMessage.getSpeaker();
    if (source) speaker.alias = source;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer system">${content}</div>`,
        whisper: [game.user._id]
    });
}

export function ErrorMessage(content, source)
{
    let speaker = ChatMessage.getSpeaker();
    if (source) speaker.alias = source;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer error">${content}</div>`,
        whisper: [game.user._id]
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

import { getActor } from "./actor.js";
import { awakenCommand } from "./halloween.js";

const COMMANDS = {
    // Chat commands
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
    "whisper": whisperCommand,
    // Action commands
    "awaken": awakenCommand, // Halloween Event
};

function spongebobCase(s) {
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
function numberToWords(x) {
    if (x >= 0 && x <= 10) {
        return NUMBER_WORDS[x];
    }
    return x.toString();
}

function memoteCommand(args) {
    let speaker = ChatMessage.getSpeaker();
    let alias = speaker.alias;
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer emote">
            <img class="inline-img" src="Players/Gamemaster/spongebob.png" width=36 height=36/>
            ${spongebobCase(alias)} ${spongebobCase(args)}
        </div>`
    });
}

function oocCommand(args) {
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer ooc">${args}</div>`
    });
}

function emoteCommand(args) {
    let speaker = ChatMessage.getSpeaker();
    let alias = speaker.alias;
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer emote">${alias} ${args}</div>`
    });
}

export function storyCommand(args) {
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer story">${args}</div>`
    });
}

function narrateCommand(args) {
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer narrate">${args}</div>`
    });
}

function UserLookup(name) {
    let user = game.users.find(u => (u.name === name || u.charname === name));
    if (user) {
        return user.id;
    }

    return null;
}

function helpCommand(args) {
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

function sendRegularMessage(message) {
    let speaker = ChatMessage.getSpeaker();
    let character = game.user.character;
    if (character) {
        speaker.alias = character.name;
    }
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: message
    });
}

const WHISPER_PATTERN = /^\s*("[^"]*?"|[a-z0-9_-]+)\s*/i;
function whisperCommand(args) {
    let target = null;
    let content = args.replace(WHISPER_PATTERN, (_, m) => {
        target = m;
        return "";
    });

    if (!target) {
        ErrorMessage("No whisper target specified.");
        return;
    }

    let targetId = UserLookup(target);
    if (!targetId) {
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
export function preChatMessage(chatLog, message, chatData) {
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
        const img = game.lightbearer.emoji[m];
        if (img) {
            return `<img class="lightbearer emoji" src="${img}" width=24 height=24/>`;
        }
        else {
            return `&lt;unrecognized emoji: ${m}&gt;`;
        }
    });

    // Check for a command pattern
    let command = null;
    message = message.replace(CMD_PATTERN, (_, m) => {
        command = m;
        return "";
    });
    if (command) {
        // Dispatch command
        const command_function = COMMANDS[command];
        if (command_function) {
            command_function(message);
            return false;
        }
        else {
            ErrorMessage(`Unknown command '${command}'.`, game.user.name);
            return false;
        }
    }

    // Send a regular chat message
    sendRegularMessage(message);
    return false;
}

export function RoundUpdateMessage(round) {
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = " ";
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer round-update">Round ${numberToWords(round)}</div>`
    });
}

export function EventMessage(content, source) {
    let speaker = ChatMessage.getSpeaker();
    if (source) speaker.alias = source;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer event">${content}</div>`,
    });
}

export function TurnUpdateMessage(name, alias) {
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = alias;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer turn-update">${name}</div>`
    });
}

export function SystemMessage(content, source) {
    let speaker = ChatMessage.getSpeaker();
    if (source) speaker.alias = source;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer system">${content}</div>`,
        whisper: [game.user.id]
    });
}

export function ErrorMessage(content, source) {
    let speaker = ChatMessage.getSpeaker();
    if (source) speaker.alias = source;
    ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: `<div class="lightbearer error">${content}</div>`,
        whisper: [game.user.id]
    });
}

// Chat Message Creation Hook
export function onChatExport() {
    let date = new Date().toDateString().replace(/\s/g, "-");
    let output = "<!DOCTYPE html>";

    // File header
    output += `<html>`;
    output += `<head>`;
    output += `<title>${date} Chat Log</title>`;
    output += `<link href="https://dnd.miramontes.dev/systems/lightbearer/styles/lightbearer.css" rel="stylesheet" type="text/css">`;
    output += `<style>`;
    output += `img {display: none}`;
    output += `</style>`;
    output += `</head>`;
    output += `<body>`;

    // Chat log header
    output += `<ol id="chat-log">`;

    // Chat log body
    for (let message of game.messages.contents) {
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


export async function onRenderChatLog(html) {
}


export async function onRenderChatMessage(html) {
    html.on('click', '.chat-template .caption', onChatTemplateCaptionClicked);
    html.on('click', '.chat-template .roll', onChatTemplateRollClicked);
}


async function onChatTemplateCaptionClicked(ev) {
    const caption = $(ev.currentTarget);

    // Get source actor
    const actor = getActor(caption.data("tokenId"));
    if (!actor) return;

    // Get current ability object
    const ability = actor.items.get(caption.data("abilityId"));
    if (!ability) return;

    // Get containing message
    const message = game.messages.get(caption.closest(".chat-message").data("messageId"));

    // Get template data
    const abilityData = ability.getRollData();
    abilityData.actorName = actor.name;
    abilityData.itemName = ability.name;
    abilityData.owned = actor.isOwner;

    // Render ability menu
    const templateContent = await renderTemplate(
        "systems/lightbearer/html/activated-ability.html",
        abilityData
    );
    Dialog.prompt({
        title: "Activated Ability",
        content: templateContent,
        label: "Close",
        rejectClose: false,
        callback: html => { },
        render: html => {
            html.on('click', '.undo', async ev => {
                // Add action back to character
                if (game.combat && game.combat.combatant) {
                    const updates = {};
                    // Undo cooldown
                    updates[`data.cooldowns.${ability.id}`] = 0;
                    // Add action back
                    if (abilityData.actionCost == "action") {
                        updates["data.actions.value"] = Math.min(
                            actor.data.data.actions.value + 1,
                            actor.data.data.actions.max
                        );
                    }
                    else if (abilityData.actionCost == "reaction") {
                        updates["data.reactions.value"] = Math.min(
                            actor.data.data.reactions.value + 1,
                            actor.data.data.reactions.max
                        );
                    }
                    // Perform update
                    actor.update(updates);
                }

                // Delete message and close dialog
                await message.delete();
                html.find('.dialog-button.ok').trigger('click');
            });
        }
    });
}


async function onChatTemplateRollClicked(ev) {
    const rollItem = $(ev.currentTarget);
    const rowId = rollItem.closest(".chat-template .item").data("rowId");
    const resultData = JSON.parse(atob(rollItem.data("results")));
    resultData.modified = rollItem.data("modified");
    resultData.isGM = game.user.isGM;

    // Get entire message containing this row
    const message = game.messages.get(
        rollItem.closest(".chat-message").data("messageId")
    );
    // Get message's contents
    const content = $("<div>" + message.content + "</div>");
    // Find roll total element
    const roll = content.find(".chat-template .item").filter(function () {
        return $(this).data("rowId") == rowId;
    }).find(".roll");

    // Modify function used for the click handlers
    function modifyTotal(html, amount) {
        // Set modified total
        roll.attr("data-modified", amount);
        roll.text(amount + "*");
        // Set the total in this dialog
        const totalTerm = html.find(".result.overview .die.term");
        totalTerm.text(amount);
        totalTerm.addClass("modified");
        // Update message for everyone
        message.update({
            content: content.html()
        });
        resultData.modified = amount;
    }

    const templateContent = await renderTemplate(
        "systems/lightbearer/html/roll-results.html",
        resultData
    );
    Dialog.prompt({
        title: "Roll Results",
        content: templateContent,
        label: "Close",
        rejectClose: false,
        callback: html => { },
        render: html => {
            html.on('click', '.roll-controls .add', async ev => {
                const item = content.find(".chat-template .item").filter(function () {
                    return $(this).data("rowId") == rowId;
                });
                const newItem = await templateRow(resultData.label, resultData.formula, resultData.color);
                item.after(newItem);
                message.update({
                    content: content.html()
                });
                html.find('.dialog-button.ok').trigger('click');
            });
            html.on('click', '.roll-controls .delete', ev => {
                // Delete this row from message
                content.find(".chat-template .item").filter(function () {
                    return $(this).data("rowId") == rowId;
                }).remove();
                // Update message for everyone
                message.update({
                    content: content.html()
                });
                html.find('.dialog-button.ok').trigger('click');
            });
            html.on('click', '.roll-controls .zero', ev => {
                modifyTotal(html, 0);
            });
            html.on('click', '.roll-controls .increment', ev => {
                if (typeof resultData.modified === "number")
                    modifyTotal(html, parseInt(resultData.modified) + 1);
                else
                    modifyTotal(html, parseInt(resultData.total) + 1);
            });
            html.on('click', '.roll-controls .decrement', ev => {
                if (typeof resultData.modified === "number")
                    modifyTotal(html, parseInt(resultData.modified) - 1);
                else
                    modifyTotal(html, parseInt(resultData.total) - 1);
            });
            html.on('click', '.roll-controls .halve', ev => {
                if (typeof resultData.modified === "number")
                    modifyTotal(html, parseInt(parseInt(resultData.modified) / 2));
                else
                    modifyTotal(html, parseInt(parseInt(resultData.total) / 2));
            });
            html.on('click', '.roll-controls .double', ev => {
                if (typeof resultData.modified === "number")
                    modifyTotal(html, parseInt(resultData.modified) * 2);
                else
                    modifyTotal(html, parseInt(resultData.total) * 2);
            });
            html.on('click', '.roll-controls .reset', ev => {
                // Set modified total
                const modified = resultData.total;
                roll.attr("data-modified", null);
                roll.text(modified);
                // Set the total in this dialog
                const totalTerm = html.find(".result.overview .die.term");
                totalTerm.text(modified);
                totalTerm.removeClass("modified");
                // Update message for everyone
                message.update({
                    content: content.html()
                });
                resultData.modified = null;
            });
        }
    });
}


export function titlecase(str) {
    return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
}


export function dedent(str) {
    str = str.replace(/^\n/, "");
    let match = str.match(/^\s+/);
    return match ? str.replace(new RegExp("^" + match[0], "gm"), "") : str;
}


export function indent(str, count) {
    if (!count) count = 1;
    return str.replace(/^/gm, "    ".repeat(count));
}


function oxfordList(array) {
    if (array.length == 0) return "no one";
    else if (array.length == 1) return array[0];
    else if (array.length == 2) return array.join(" and ");
    array = array.slice();
    array[array.length - 1] = `and ${array[array.length - 1]}`;
    return array.join(", ");
}


export function templateDescription(description) {
    return (`<div class="description">${description}</div>`);
}


export function templateUsage(source, targetNames) {
    const templates = Object.values(source.system.usage_phrases);
    if (templates.length == 0) return "";
    const template = templates[Math.floor(Math.random() * templates.length)];
    const targetString = oxfordList(Array.from(targetNames));
    const variables = {
        ITEM: source.name,
        ITEM_NAME: source.name,
        CHARACTER: source.actor.name,
        CHARACTER_NAME: source.actor.name,
        CHARACTER_POSSESSIVE_PRONOUN: source.actor.system.possessive_pronoun,
        CHARACTER_SUBJECTIVE_PRONOUN: source.actor.system.subjective_pronoun,
        POSSESSIVE_PRONOUN: source.actor.system.possessive_pronoun,
        SUBJECTIVE_PRONOUN: source.actor.system.subjective_pronoun,
        POSSESSIVE: source.actor.system.possessive_pronoun,
        SUBJECTIVE: source.actor.system.subjective_pronoun,
        TARGET: targetString,
        TARGETS: targetString,
        TARGET_NAME: targetString,
        TARGET_NAMES: targetString
    };

    const usage_phrase = template.replace(/\$\{([a-z0-9_-]+)\}/ig, (match, variable) => {
        return variables[variable];
    });

    return (`<div class="description"><p>${usage_phrase}</p></div>`);
}


export async function send(content) {
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    return await ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: dedent(`
            <div class="chat-template">
                ${content}
            </div>
        `)
    });
}


export function templateActor(actor, content, displayName) {
    if (content === undefined) content = "";
    if (displayName === undefined) {
        if (actor.token) displayName = actor.token.name;
        else displayName = actor.name;
    }

    let tags = "actor";
    if (actor.hasPlayerOwner) {
        tags += " player";
    }
    else {
        tags += " npc";
    }

    return dedent(`
        <div class="${tags}">
            <div class="name">${displayName}</div>
            ${content}
        </div>
    `);
}


export async function templateRow(label, formula, color, rollData) {
    if (rollData === undefined)
        rollData = {};
    if (color === undefined)
        color = "";

    if (!Roll.validate(formula))
        return templateTextRow(label, formula, color);

    const roll = new Roll(formula, rollData);
    await roll.roll({ async: true });
    const resultData = [];
    let crit = true;
    let fail = true;
    for (const die of roll.dice) {
        const rolls = die.results;
        rolls.forEach(r => {
            if (r.result != 1)
                fail = false;
            if (r.result != die.faces)
                crit = false;
            // Fail or success coloring
            if (r.result == 1)
                r.classes = "failure";
            else if (r.result == die.faces)
                r.classes = "success";
            else
                r.classes = "";
            // Face count icon
            if (die.faces == 4)
                r.classes += " d4";
            else if (die.faces == 8)
                r.classes += " d8";
            else if (die.faces == 10)
                r.classes += " d10";
            else if (die.faces == 12)
                r.classes += " d12";
            else if (die.faces == 20)
                r.classes += " d20";
        });
        resultData.push({
            formula: `${die.number}d${die.faces}`,
            rolls: rolls
        });
    }

    const resultString = btoa(JSON.stringify({
        label: label,
        original: formula,
        formula: roll.formula,
        total: roll.total,
        results: resultData,
        crit: crit,
        fail: fail,
        color: color,
    }));

    return dedent(`
        <div class="item ${color}" data-row-id="${randomID(16)}">
            <div class="label">${label}</div>
            <div class="roll" data-results="${resultString}">
                ${Math.round(roll.total)}
            </div>
        </div>
    `);
}


export function templateTextRow(label, text, color) {
    if (color === undefined) color = "";
    return dedent(`
        <div class="item ${color}">
            <div class="label">${label}: ${text}</div>
        </div>
    `);
}


export function templateHeader(source, token) {
    if (source.constructor.name == "LightbearerActor") {
        return `<div class="caption">${source.name}</div>`;
    }
    else if (source.constructor.name == "LightbearerItem") {
        // If no token is passed, find a token
        if (!token) token = getActor(source).getToken();

        return dedent(`
            <a class="caption" data-token-id="${token.id}" data-ability-id="${source.id}">
                ${token.name}: ${source.name}
            </a>
        `);
    }
    else {
        return `<div class="caption">ERROR: Unknown source</div>`;
    }
}

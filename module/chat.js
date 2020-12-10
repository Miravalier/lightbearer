import * as ui from "./ui.js"

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
        if (img)
        {
            return `<img class="lightbearer emoji" src="${img}" width=24 height=24/>`;
        }
        else
        {
            return `&lt;unrecognized emoji: ${m}&gt;`;
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

export function RoundUpdateMessage(round)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = " ";
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer round-update">Round ${numberToWords(round)}</div>`
    });
}

export function TurnUpdateMessage(name, alias)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = alias;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: `<div class="lightbearer turn-update">${name}</div>`
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
    output += `<link href="https://dnd.miramontes.dev/systems/lightbearer/styles/lightbearer.css" rel="stylesheet" type="text/css">`;
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


export async function onRenderChatLog(html)
{
}


export async function onRenderChatMessage(html)
{
    html.on('click', '.chat-template.caption', onChatTemplateCaptionClicked);
    html.on('click', '.chat-template.roll', onChatTemplateRollClicked);
}


async function onChatTemplateCaptionClicked(ev)
{
    const caption = $(ev.currentTarget);
    const message = game.messages.get(
        caption.closest(".chat-message").data("messageId")
    );
    message.children('.message-content').append()
}


async function onChatTemplateRollClicked(ev)
{
    const rollItem = $(ev.currentTarget);
    const rowId = rollItem.closest(".chat-template.item").data("rowId");
    const resultData = JSON.parse(atob(rollItem.data("results")));
    resultData.modified = rollItem.data("modified");
    resultData.isGM = game.user.isGM;

    // Get entire message containing this row
    const message = game.messages.get(
        rollItem.closest(".chat-message").data("messageId")
    );
    // Get message's contents
    const content = $("<div>"+message.data.content+"</div>");
    // Find roll total element
    const roll = content.find(".chat-template.item").filter(function () {
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
        "systems/5e-lite/html/roll-results.html",
        resultData
    );
    Dialog.prompt({
        title: "Roll Results",
        content: templateContent,
        label: "Close",
        callback: html => {},
        render: html => {
            html.on('click', '.roll-controls .add', ev => {
                message.update({
                    content: message.data.content + templateRow(
                        resultData.label, resultData.formula
                    )
                });
                html.find('.dialog-button.ok').trigger('click');
            });
            html.on('click', '.roll-controls .delete', ev => {
                // Delete this row from message
                content.find(".chat-template.item").filter(function () {
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
                if (resultData.modified)
                    modifyTotal(html, parseInt(resultData.modified) + 1);
                else
                    modifyTotal(html, parseInt(resultData.total) + 1);
            });
            html.on('click', '.roll-controls .decrement', ev => {
                if (resultData.modified)
                    modifyTotal(html, parseInt(resultData.modified) - 1);
                else
                    modifyTotal(html, parseInt(resultData.total) - 1);
            });
            html.on('click', '.roll-controls .halve', ev => {
                if (resultData.modified)
                    modifyTotal(html, parseInt(parseInt(resultData.modified) / 2));
                else
                    modifyTotal(html, parseInt(parseInt(resultData.total) / 2));
            });
            html.on('click', '.roll-controls .double', ev => {
                if (resultData.modified)
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


function dedent(str) {
	str = str.replace(/^\n/, "");
	let match = str.match(/^\s+/);
	return match ? str.replace(new RegExp("^"+match[0], "gm"), "") : str;
}


function indent(str, count)
{
    if (!count) count = 1;
    return str.replace(/^/gm, "    ".repeat(count));
}


function oxfordList(array) {
    if (array.length == 0) return "no one";
    else if (array.length == 1) return array[0];
    else if (array.length == 2) return array.join(" and ");
    array = array.slice();
    array[array.length-1] = `and ${array[array.length-1]}`;
    return array.join(", ");
}


export function templateDescription(source)
{
    let description = source.data.data.description;
    return (`<div class="chat-template description">${description}</div>`);
}


export function templateUsage(source, targetNames)
{
    const templates = Object.values(source.data.data.usage_phrases);
    if (templates.length == 0) return "";
    const template = templates[Math.floor(Math.random() * templates.length)];
    const targetString = oxfordList(Array.from(targetNames));
    const variables = {
        ITEM: source.name,
        ITEM_NAME: source.name,
        CHARACTER: source.actor.name,
        CHARACTER_NAME: source.actor.name,
        CHARACTER_POSSESSIVE_PRONOUN: source.actor.data.data.possessive_pronoun,
        CHARACTER_SUBJECTIVE_PRONOUN: source.actor.data.data.subjective_pronoun,
        POSSESSIVE_PRONOUN: source.actor.data.data.possessive_pronoun,
        SUBJECTIVE_PRONOUN: source.actor.data.data.subjective_pronoun,
        POSSESSIVE: source.actor.data.data.possessive_pronoun,
        SUBJECTIVE: source.actor.data.data.subjective_pronoun,
        TARGET: targetString,
        TARGETS: targetString,
        TARGET_NAME: targetString,
        TARGET_NAMES: targetString
    };

    const usage_phrase = template.replace(/\$\{([a-z0-9_-]+)\}/ig, (match, variable) => {
        return variables[variable];
    });

    return (`<div class="chat-template description"><p>${usage_phrase}</p></div>`);
}


export async function templateRolls(source, targetNames)
{
    const rows = [];
    let target = null;
    let targets = null;
    let fields = null;
    const rollData = source.actor.getRollData();
    const template = source.data.data.template;

    // Roll each untargeted row
    fields = Object.values(template).filter(row => row.target_type === "None");
    for (const field of fields)
    {
        rows.push(templateRow(field.label, field.formula, rollData));
    }

    // Roll each Individual Target row
    for (let i=1; i <= 3; i++)
    {
        target = null;
        fields = Object.values(template).filter(row => row.target_type === `Target ${i}`);
        for (const field of fields)
        {
            // Select a target the first time through
            if (!target) {
                target = await selectToken(`${source.name} Target ${i}`);
                if (!target) throw "No token selected.";
                if (!target.actor) throw "Token does not have an actor.";
                targetNames.add(target.name);
                rows.push(dedent(`
                    <div class="chat-template item">
                        <div class="chat-template label">${target.name}</div>
                    </div>
                `));
            }
            // Update roll data with the target's values
            const targetRollData = target.actor.getRollData();
            Object.keys(targetRollData).forEach(key => {
                rollData["target_" + key] = targetRollData[key];
            });
            // Create output line
            rows.push(templateRow(field.label, field.formula, rollData));
        }
    }

    // Roll each Group Target row
    for (let i=1; i <= 3; i++)
    {
        targets = null;
        fields = Object.values(template).filter(row => row.target_type === `Group ${i}`);
        for (let row of fields)
        {
            // Select targets the first time through
            if (targets === null) {
                targets = await selectTokens(`${source.name} Group ${i} Targets`);
                rollData["group_size"] = targets.size;
            }
            // Go through each target rolling this row
            for (let target of targets)
            {
                if (!target.actor) throw "Token does not have an actor.";
                // Add target to output list
                targetNames.add(target.name);
                // Update roll data with the target's values
                const targetRollData = target.actor.getRollData();
                Object.keys(targetRollData).forEach(key => {
                    rollData["target_" + key] = targetRollData[key];
                });
                // Roll the row
                rows.push(templateRow(target.name + " " + row.label, row.formula, rollData));
            }
        }
    }

    return rows.join('\n');
}


export function send(content)
{
    let speaker = ChatMessage.getSpeaker();
    speaker.alias = game.user.name;
    ChatMessage.create({
        user: game.user._id,
        speaker: speaker,
        content: content
    });
}


export function templateRow(label, formula, rollData)
{
    if (!rollData) rollData = {};
    if (formula) {
        const roll = new Roll(formula, rollData);
        roll.roll();
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
        }));
        let color = "";
        if (label.toLowerCase().indexOf("damage") !== -1)
            color = "red";
        if (label.toLowerCase().indexOf("healing") !== -1)
            color = "green";
        return dedent(`
            <div class="chat-template item ${color}" data-row-id="${randomID(16)}">
                <div class="chat-template label">${label}</div>
                <div class="chat-template roll" data-results="${resultString}">
                    ${Math.round(roll.total)}
                </div>
            </div>
        `);
    }
    else {
        return dedent(`
            <div class="chat-template item">
                <div class="chat-template label">${label}</div>
            </div>
        `);
    }
}


export function templateHeader(source)
{
    return `<div class="chat-template caption">${source.name}</div>`;
}

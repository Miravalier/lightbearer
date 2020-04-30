export class ChatTemplate {
    constructor(source, template, buttons) {
        if (source.entity === "Actor")
        {
            this.title = "";
            this.origin = source.name;
            this.description = "";
            this.template = {};
            this.buttons = {};
        }
        else if (source.entity === "Item")
        {
            if (source.actor) {
                this.title = source.name;
                this.origin = source.actor.name;
            }
            else
            {
                this.title = "";
                this.origin = source.name;
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
        output += '<div class="chat-template label caption">';
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
                output += '<div class="chat-template item centered-row">';
                output += `<div class="chat-template label">${value.label}</div>`;
                output += `<div class="chat-template roll">[[${value.roll}]]</div>`;
                output += '</div>';
            }
            output += '</div>';
        }
        // TODO Build Button Footer
        // Return
        return output;
    }
}

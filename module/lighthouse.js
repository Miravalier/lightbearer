const broadcasters = {};
const stores = {};
let websocket = null;

function websocket_message_handler(event) {
    const message = JSON.parse(event.data);
    if (!message.namespace || !message.data) {
        return;
    }

    if (message.type == "broadcast") {
        const broadcaster = broadcasters[message.namespace];
        if (broadcaster) {
            for (let callback of broadcaster.callbacks) {
                callback(message.data);
            }
        }
    }

    else if (message.type == "store-sync") {
        const store = stores[message.namespace];
        if (store) {
            for (let [key, value] of Object.entries(message.data)) {
                store.data[key] = value;
            }
            store.sync_resolve(true);
        }
    }

    else if (message.type == "store-update") {
        const store = stores[message.namespace];
        if (store) {
            store.data[message.data.key] = message.data.value;
            for (let callback of store.callbacks) {
                callback(message.data.key, message.data.value);
            }
        }
    }
}

function websocket_error_handler(_event) {
    console.error("An error occured on the lighthouse connection.");
    reopen_websocket();
}

function websocket_close_handler(event) {
    console.error("Connection to lighthouse closed!");
    console.log(event)
    reopen_websocket();
}

function websocket_open_handler(_event) {
    console.log("Connection to lighthouse opened!");
}

export function open_websocket() {
    console.log("Attempting to connect to lighthouse...");
    websocket = new WebSocket('wss://dnd.miramontes.dev/lighthouse');
    websocket.onerror = websocket_error_handler;
    websocket.onmessage = websocket_message_handler;
    websocket.onclose = websocket_close_handler;
    websocket.onopen = websocket_open_handler;

    setInterval(() => {
        websocket.send(JSON.stringify({
            type: "broadcast",
            namespace: "ping",
            data: null,
        }));
    }, 15000);
}


function reopen_websocket() {
    console.log("Attempting to re-connect to lighthouse...");
    websocket = new WebSocket('wss://dnd.miramontes.dev/lighthouse');
    websocket.onerror = websocket_error_handler;
    websocket.onmessage = websocket_message_handler;
    websocket.onclose = websocket_close_handler;
    websocket.onopen = websocket_open_handler;
}

export class Store {
    constructor(namespace) {
        this.namespace = namespace;
        this.callbacks = [];
        this.data = {};
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        websocket.send(JSON.stringify({
            type: "store-update",
            namespace: this.namespace,
            key,
            value
        }));
    }

    add_callback(callback) {
        this.callbacks.push(callback);
    }

    remove_callback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index == -1) {
            return;
        }
        this.callbacks.splice(index, 1);
    }

    clear_callbacks() {
        this.callbacks = [];
    }

    static async create(namespace) {
        let store = stores[namespace];
        if (!store) {
            store = new Store(namespace);
            stores[namespace] = store;
            const promise = new Promise(resolve => {
                store.sync_resolve = resolve;
            });
            websocket.send(JSON.stringify({
                type: "store-sync",
                namespace: namespace,
            }));
            await promise;
        }
        return store;
    }
}

export class Broadcaster {
    constructor(namespace) {
        this.namespace = namespace;
        this.callbacks = [];
    }

    send(data) {
        websocket.send(JSON.stringify({
            type: "broadcast",
            namespace: this.namespace,
            data: data,
        }));
    }

    add_callback(callback) {
        this.callbacks.push(callback);
    }

    remove_callback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index == -1) {
            return;
        }
        this.callbacks.splice(index, 1);
    }

    clear_callbacks() {
        this.callbacks = [];
    }

    static create(namespace) {
        let broadcaster = broadcasters[namespace];
        if (!broadcaster) {
            broadcaster = new Broadcaster(namespace);
            broadcasters[namespace] = broadcaster;
        }
        return broadcaster;
    }
}

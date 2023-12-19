'use strict';

var core = require('@tauri-apps/api/core');

// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
class WebSocket {
    constructor(id, listeners) {
        this.id = id;
        this.listeners = listeners;
    }
    static async connect(url, config) {
        const listeners = [];
        const onMessage = new core.Channel();
        onMessage.onmessage = (message) => {
            listeners.forEach((l) => l(message));
        };
        if (config?.headers) {
            config.headers = Array.from(new Headers(config.headers).entries());
        }
        return await core.invoke("plugin:websocket|connect", {
            url,
            onMessage,
            config,
        }).then((id) => new WebSocket(id, listeners));
    }
    addListener(cb) {
        this.listeners.push(cb);
    }
    async send(message) {
        let m;
        if (typeof message === "string") {
            m = { type: "Text", data: message };
        }
        else if (typeof message === "object" && "type" in message) {
            m = message;
        }
        else if (Array.isArray(message)) {
            m = { type: "Binary", data: message };
        }
        else {
            throw new Error("invalid `message` type, expected a `{ type: string, data: any }` object, a string or a numeric array");
        }
        return await core.invoke("plugin:websocket|send", {
            id: this.id,
            message: m,
        });
    }
    async disconnect() {
        return await this.send({
            type: "Close",
            data: {
                code: 1000,
                reason: "Disconnected by client",
            },
        });
    }
}

module.exports = WebSocket;

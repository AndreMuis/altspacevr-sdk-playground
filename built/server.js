"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
const path_1 = require("path");
const plane_tiling_1 = __importDefault(require("./plane-tiling"));
process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));
// Start listening for connections, and serve static files
const server = new mixed_reality_extension_sdk_1.WebHost({
    baseDir: path_1.resolve(__dirname, '../public')
});
// server.adapter.onConnection(context => new Demo(context, server.baseUrl));
// server.adapter.onConnection(context => new EaseCurve(context, server.baseUrl));
// server.adapter.onConnection(context => new LookAt(context, server.baseUrl));
server.adapter.onConnection(context => new plane_tiling_1.default(context, server.baseUrl));
exports.default = server;
//# sourceMappingURL=server.js.map
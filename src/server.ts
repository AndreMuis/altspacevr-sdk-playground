/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WebHost } from '@microsoft/mixed-reality-extension-sdk';
import { resolve as resolvePath } from 'path';

import Demo from './app';
import EaseCurve from './ease-curve';
import LookAt from './look-at';
import PlaneTiling from './plane-tiling';

import { userInfo } from 'os';

process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));

// Start listening for connections, and serve static files
const server = new WebHost({
    baseDir: resolvePath(__dirname, '../public')
});

server.adapter.onConnection(context => new Demo(context, server.baseUrl));
// server.adapter.onConnection(context => new EaseCurve(context, server.baseUrl));
// server.adapter.onConnection(context => new LookAt(context, server.baseUrl));
// server.adapter.onConnection(context => new PlaneTiling(context, server.baseUrl));

export default server;
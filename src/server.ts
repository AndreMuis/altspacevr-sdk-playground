/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// network, network-content, app
// log.enable('network')

import { WebHost, log } from '@microsoft/mixed-reality-extension-sdk'
import { resolve as resolvePath } from 'path'

import SDKPlayground from './app'
import EaseCurve from './ease-curve'
import ManyObjects from './many-objects'

process.on('uncaughtException', err => console.log('uncaughtException', err))
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason))

// Start listening for connections, and serve static files
const server = new WebHost({
    baseDir: resolvePath(__dirname, '../public')
})

server.adapter.onConnection(context => new SDKPlayground(context, server.baseUrl))
// server.adapter.onConnection(context => new EaseCurve(context, server.baseUrl))
// server.adapter.onConnection(context => new ManyObjects(context, server.baseUrl))

export default server
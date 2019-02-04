import {
    Actor,
    Context,
    DegreesToRadians,
    Quaternion,
    Vector3
} from '@microsoft/mixed-reality-extension-sdk';

import * as GltfGen from '@microsoft/gltf-gen';

import { resolve } from 'path';
import Server from './server'

export default class GltfGenCrash {
    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        await this.setupGlTF();
    }

    private async setupGlTF()
    {
        const primitive = new GltfGen.MeshPrimitive({
            vertices: [
                new GltfGen.Vertex({ position: [0, 0, 0], texCoord0: [0, 0] }),
                new GltfGen.Vertex({ position: [1, 0, 0], texCoord0: [1, 0] }),
                new GltfGen.Vertex({ position: [0, 1, 0], texCoord0: [0, 1] })
            ],
            triangles: [0, 1, 2]
        });

        const factory = GltfGen.GltfFactory.FromSinglePrimitive(primitive).generateGLTF();
    
        await Actor.CreateFromGltf(this.context, {
            resourceUrl: Server.registerStaticBuffer('triangle.glb', factory),
            actor: {
                transform: {
                    position: { x: 0, y: 0, z: 3 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), 180 * DegreesToRadians),
                }
            }
        });
    }
}
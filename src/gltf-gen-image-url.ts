import {
    Actor,
    Context,
    PrimitiveShape
} from '@microsoft/mixed-reality-extension-sdk';

import * as GltfGen from '@microsoft/gltf-gen';

import Server from './server'

export default class Demo {
    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        await this.setupGlTF()
    }

    private async setupGlTF()
    {
        // Beach Ball
        const material = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/beach-ball.png` 
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);

        const blobURL = Server.registerStaticBuffer('beachball', gltfFactory.generateGLTF());

        const mats = await this.context.assetManager.loadGltf('beachball', blobURL);

        await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Sphere,
                radius: 1
            },
            actor: {
                materialId: mats.materials.byIndex(0).id,
                transform: {
                    position: { x: 0, y: 0, z: 3 }
                }
            }
        });
    }
}

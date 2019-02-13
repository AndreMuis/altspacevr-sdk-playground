import {
    Actor,
    Context,
    DegreesToRadians,
    PrimitiveShape,
    Quaternion,
    Vector3
} from '@microsoft/mixed-reality-extension-sdk';

import * as GltfGen from '@microsoft/gltf-gen';

import Server from './server'

export default class PlaneMaterial {
    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        const beachBallMaterial = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/beach-ball.png`
                })
            })
        });

        const gltfFactory = new GltfGen.GltfFactory(null, null, [beachBallMaterial]);

        const buffer = Server.registerStaticBuffer('gltf-buffer', gltfFactory.generateGLTF());
    
        const assetGroup = await this.context.assetManager.loadGltf('gltf-buffer', buffer);

        // Sphere
        Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Sphere,
                radius: 0.5
            },
            actor: {
                materialId: assetGroup.materials.byIndex(0).id,
                transform: {
                    position: { x: -1, y: 0.5, z: 3 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), 180 * DegreesToRadians)
                }
            }
        });

        // Plane
        Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Plane,
                dimensions: { x: 1, y: 0, z: 1 },
            },
            actor: {
                materialId: assetGroup.materials.byIndex(0).id,
                transform: {
                    position: { x: 1, y: 0.5, z: 3 },
                    rotation: Quaternion.RotationAxis(Vector3.Right(), -90 * DegreesToRadians)
                },
            }
        });
    }
}

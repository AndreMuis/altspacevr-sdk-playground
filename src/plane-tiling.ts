import {
    Actor,
    Context,
    DegreesToRadians,
    PrimitiveShape,
    Quaternion,
    Vector3
} from '@microsoft/mixed-reality-extension-sdk';

export default class PlaneTiling {
    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        const beachBallTexture = await this.context.assetManager.createTexture('beach-ball', {
            uri: `${this.baseUrl}/beach-ball.png`
        });

        const beachBallMaterial = await this.context.assetManager.createMaterial('beach-ball', {
            mainTextureId: beachBallTexture.id
        });

        // Plane - not tiled
        beachBallMaterial.mainTextureScale.set(1, 1);

        Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Plane,
                dimensions: { x: 1, y: 0, z: 1 }
            },
            actor: {
                materialId: beachBallMaterial.id,
                transform: {
                    position: { x: -1, y: 0.5, z: 3 },
                    rotation: Quaternion.RotationAxis(Vector3.Right(), -90 * DegreesToRadians)
                },
            }
        });

        // Plane - tiled
        beachBallMaterial.mainTextureScale.set(2, 2);

        Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Plane,
                dimensions: { x: 2, y: 0, z: 2 }
            },
            actor: {
                materialId: beachBallMaterial.id,
                transform: {
                    position: { x: 1, y: 1, z: 3 },
                    rotation: Quaternion.RotationAxis(Vector3.Right(), -90 * DegreesToRadians)
                },
            }
        });
    }
}

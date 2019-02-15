"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
class PlaneTiling {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.context.onStarted(() => this.started());
    }
    async started() {
        const beachBallTexture = await this.context.assetManager.createTexture('beach-ball', {
            uri: `${this.baseUrl}/beach-ball.png`
        });
        const beachBallMaterial = await this.context.assetManager.createMaterial('beach-ball', {
            mainTextureId: beachBallTexture.id
        });
        // Plane - not tiled
        beachBallMaterial.mainTextureScale.set(1, 1);
        mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Plane,
                dimensions: { x: 1, y: 0, z: 1 }
            },
            actor: {
                materialId: beachBallMaterial.id,
                transform: {
                    position: { x: -1, y: 0.5, z: 3 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Right(), -90 * mixed_reality_extension_sdk_1.DegreesToRadians)
                },
            }
        });
        // Plane - tiled
        beachBallMaterial.mainTextureScale.set(2, 2);
        mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Plane,
                dimensions: { x: 2, y: 0, z: 2 }
            },
            actor: {
                materialId: beachBallMaterial.id,
                transform: {
                    position: { x: 1, y: 1, z: 3 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Right(), -90 * mixed_reality_extension_sdk_1.DegreesToRadians)
                },
            }
        });
    }
}
exports.default = PlaneTiling;
//# sourceMappingURL=plane-tiling.js.map
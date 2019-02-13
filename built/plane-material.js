"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
const GltfGen = __importStar(require("@microsoft/gltf-gen"));
const server_1 = __importDefault(require("./server"));
class PlaneMaterial {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.context.onStarted(() => this.started());
    }
    async started() {
        const beachBallMaterial = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/beach-ball.png`
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [beachBallMaterial]);
        const buffer = server_1.default.registerStaticBuffer('gltf-buffer', gltfFactory.generateGLTF());
        const assetGroup = await this.context.assetManager.loadGltf('gltf-buffer', buffer);
        // Sphere
        mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Sphere,
                radius: 0.5
            },
            actor: {
                materialId: assetGroup.materials.byIndex(0).id,
                transform: {
                    position: { x: -1, y: 0.5, z: 3 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), 180 * mixed_reality_extension_sdk_1.DegreesToRadians)
                }
            }
        });
        // Plane
        mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Plane,
                dimensions: { x: 1, y: 0, z: 1 },
            },
            actor: {
                materialId: assetGroup.materials.byIndex(0).id,
                transform: {
                    position: { x: 1, y: 0.5, z: 3 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Right(), -90 * mixed_reality_extension_sdk_1.DegreesToRadians)
                },
            }
        });
    }
}
exports.default = PlaneMaterial;
//# sourceMappingURL=plane-material.js.map
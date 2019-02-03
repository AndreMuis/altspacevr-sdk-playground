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
class GltfGenCrash {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.context.onStarted(() => this.started());
    }
    async started() {
        await this.setupGlTF();
    }
    async setupGlTF() {
        const primitive = new GltfGen.MeshPrimitive({
            vertices: [
                new GltfGen.Vertex({ position: [0, 0, 0], texCoord0: [0, 0] }),
                new GltfGen.Vertex({ position: [1, 0, 0], texCoord0: [1, 0] }),
                new GltfGen.Vertex({ position: [0, 1, 0], texCoord0: [0, 1] })
            ],
            triangles: [0, 1, 2]
        });
        const factory = GltfGen.GltfFactory.FromSinglePrimitive(primitive).generateGLTF();
        await mixed_reality_extension_sdk_1.Actor.CreateFromGltf(this.context, {
            resourceUrl: server_1.default.registerStaticBuffer('triangle.glb', factory),
            actor: {
                transform: {
                    position: { x: 0, y: 0, z: 3 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), 180 * mixed_reality_extension_sdk_1.DegreesToRadians),
                }
            }
        });
    }
}
exports.default = GltfGenCrash;
//# sourceMappingURL=gltf-gen-crash.js.map
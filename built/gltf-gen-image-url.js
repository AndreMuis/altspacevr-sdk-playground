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
class Demo {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.context.onStarted(() => this.started());
    }
    async started() {
        await this.setupGlTF();
    }
    async setupGlTF() {
        // Beach Ball
        const material = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    // uri: `${this.baseUrl}/beach-ball.png` 
                    uri: `http://altspacevr-demo.herokuapp.com/beach-ball.png`
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);
        const blobURL = server_1.default.registerStaticBuffer('beachball', gltfFactory.generateGLTF());
        const mats = await this.context.assetManager.loadGltf('beachball', blobURL);
        await mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Sphere,
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
exports.default = Demo;
//# sourceMappingURL=gltf-gen-image-url.js.map
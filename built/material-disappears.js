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
class MaterialDisappears {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.assetGroup = null;
        this.sphereActorPromises = [];
        this.context.onStarted(() => this.started());
    }
    async started() {
        await this.loadMaterials();
        await this.setupSpheres();
    }
    async loadMaterials() {
        const beachBallMaterial = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/beach-ball.png`
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [beachBallMaterial]);
        const buffer = server_1.default.registerStaticBuffer('gltf-buffer', gltfFactory.generateGLTF());
        this.assetGroup = await this.context.assetManager.loadGltf('gltf-buffer', buffer);
    }
    async setupSpheres() {
        this.setupSphereActors();
        // Drop Button
        const dropBoxActor = await mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Box,
                dimensions: { x: 0.6, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                transform: {
                    position: { x: 0, y: 0, z: 7 }
                }
            }
        });
        await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: dropBoxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Drop",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        });
        const dropButtonBehavior = dropBoxActor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        dropButtonBehavior.onClick('pressed', (userId) => {
            this.sphereActorPromises.forEach(promise => promise.value.rigidBody.useGravity = true);
        });
    }
    async setupSphereActors() {
        this.sphereActorPromises = [];
        for (let x = -2; x <= 2; x = x + 2) {
            for (let y = 2; y <= 12; y = y + 1) {
                for (let z = 8; z <= 12; z = z + 2) {
                    const sphereActorPromise = mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: mixed_reality_extension_sdk_1.PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            materialId: this.assetGroup.materials.byIndex(0).id,
                            transform: {
                                position: {
                                    x: x + Math.random() / 2.0,
                                    y: y,
                                    z: z + Math.random() / 2.0
                                }
                            }
                        }
                    });
                    this.sphereActorPromises.push(sphereActorPromise);
                }
            }
        }
        this.sphereActorPromises.forEach(promise => promise.value.enableRigidBody({ useGravity: false }));
    }
}
exports.default = MaterialDisappears;
//# sourceMappingURL=material-disappears.js.map
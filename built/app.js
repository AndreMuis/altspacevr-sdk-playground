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
const mixed_reality_extension_altspacevr_extras_1 = require("@microsoft/mixed-reality-extension-altspacevr-extras");
const GltfGen = __importStar(require("@microsoft/gltf-gen"));
const server_1 = __importDefault(require("./server"));
class Demo {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.assetGroup = null;
        this.lastUser = null;
        this.isCesiumManWalking = false;
        this.cabinActor = null;
        this.skullActor = null;
        this.sphereActorPromises = [];
        this.logActor = null;
        this.userJoined = async (user) => {
            this.lastUser = user;
            if (this.skullActor != null) {
                this.skullActor.lookAt(this.lastUser, mixed_reality_extension_sdk_1.LookAtMode.TargetXY);
            }
            this.addToLog(user.name);
        };
        this.expandAnimationData = [{
                time: 0,
                value: { transform: { scale: { x: 1, y: 1, z: 1 } } }
            }, {
                time: 0.2,
                value: { transform: { scale: { x: 1.1, y: 1.1, z: 1.1 } } }
            }];
        this.contractAnimationData = [{
                time: 0,
                value: { transform: { scale: { x: 1.1, y: 1.1, z: 1.1 } } }
            }, {
                time: 0.2,
                value: { transform: { scale: { x: 1, y: 1, z: 1 } } }
            }];
        this.context.onStarted(() => this.started());
        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);
        this.videoPlayerManager = new mixed_reality_extension_altspacevr_extras_1.VideoPlayerManager(context);
    }
    async started() {
        await this.loadMaterials();
        await this.setupScene();
        await this.setupCesiumMan();
        await this.setupSkull();
        await this.setupSpheres();
        await this.setupLight();
        await this.setupTeleporter();
        await this.setupVideoPlayer();
        if (this.lastUser != null) {
            this.skullActor.lookAt(this.lastUser, mixed_reality_extension_sdk_1.LookAtMode.TargetXY);
        }
    }
    addToLog(message) {
        console.log(message);
        if (this.logActor != null) {
            this.logActor.text.contents = message + "\n" + this.logActor.text.contents;
        }
    }
    async loadMaterials() {
        const beachBallMaterial = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/beach-ball.png`
                })
            })
        });
        const grassMaterial = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/grass.png`
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [grassMaterial, beachBallMaterial]);
        const buffer = server_1.default.registerStaticBuffer('gltf-buffer', gltfFactory.generateGLTF());
        this.assetGroup = await this.context.assetManager.loadGltf('gltf-buffer', buffer);
    }
    async setupScene() {
        // Title
        mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    position: { x: 0, y: 5, z: 8 }
                },
                text: {
                    contents: "SDK Playground",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 255 / 255, g: 255 / 255, b: 255 / 255 },
                    height: 1.0
                }
            }
        });
        // Ground
        const grassMaterial = this.assetGroup.materials.byIndex(0);
        grassMaterial.mainTextureScale.set(1000, 1000);
        mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Plane,
                dimensions: { x: 1000, y: 0, z: 1000 }
            },
            addCollider: true,
            actor: {
                name: 'Plane',
                materialId: grassMaterial.id,
                transform: {
                    position: { x: 0, y: -1.6, z: 0 }
                }
            }
        });
        // Cabin
        this.cabinActor = await mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "993646440251130011",
            actor: {
                name: 'Cabin',
                transform: {
                    position: { x: 20, y: -1.5, z: 0.0 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), -90 * mixed_reality_extension_sdk_1.DegreesToRadians),
                    scale: { x: 0.8, y: 0.8, z: 0.8 }
                }
            }
        });
        // Log
        this.logActor = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    position: { x: -5, y: 0, z: 0 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), -90 * mixed_reality_extension_sdk_1.DegreesToRadians)
                },
                text: {
                    contents: "log start",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.1
                }
            }
        });
    }
    async setupCesiumMan() {
        const cesiumManActor = await mixed_reality_extension_sdk_1.Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1.6, z: 7 },
                    scale: { x: 1.5, y: 1.5, z: 1.5 }
                }
            }
        });
        const boxActor = await mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Box,
                dimensions: { x: 1.5, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                name: 'Box',
                transform: {
                    position: { x: 0.0, y: 1.2, z: 7 }
                }
            }
        });
        const textActor = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                parentId: boxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Start Walking",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        });
        await boxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        await boxActor.createAnimation('contract', {
            keyframes: this.contractAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create contract animation: ${reason}`));
        const buttonBehavior = boxActor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        buttonBehavior.onHover('enter', (userId) => {
            boxActor.enableAnimation('expand');
        });
        buttonBehavior.onHover('exit', (userId) => {
            boxActor.enableAnimation('contract');
        });
        buttonBehavior.onClick('pressed', (userId) => {
            textActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };
            if (this.isCesiumManWalking == true) {
                this.isCesiumManWalking = false;
                textActor.text.contents = "Start Walking";
                cesiumManActor.disableAnimation('animation:0');
            }
            else {
                this.isCesiumManWalking = true;
                textActor.text.contents = "Stop Walking";
                cesiumManActor.enableAnimation('animation:0');
            }
        });
        buttonBehavior.onClick('released', (userId) => {
            textActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
    }
    async setupSkull() {
        const skullParentActor = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Skull Parent',
                parentId: this.cabinActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });
        await skullParentActor.createAnimation('spin', {
            wrapMode: mixed_reality_extension_sdk_1.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, mixed_reality_extension_sdk_1.Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        skullParentActor.enableAnimation("spin");
        this.skullActor = await mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "986410464940392936",
            actor: {
                name: 'frog',
                parentId: skullParentActor.id,
                transform: {
                    position: { x: 0, y: 6, z: 9 },
                    scale: { x: 6, y: 6, z: 6 }
                }
            }
        });
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
                name: 'Drop Box',
                transform: {
                    position: { x: -10, y: 1, z: 7 }
                }
            }
        });
        const dropTextActor = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
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
        await dropBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        await dropBoxActor.createAnimation('contract', {
            keyframes: this.contractAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create contract animation: ${reason}`));
        const dropButtonBehavior = dropBoxActor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        dropButtonBehavior.onHover('enter', (userId) => {
            dropBoxActor.enableAnimation('expand');
        });
        dropButtonBehavior.onHover('exit', (userId) => {
            dropBoxActor.enableAnimation('contract');
        });
        dropButtonBehavior.onClick('pressed', (userId) => {
            dropTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };
            this.sphereActorPromises.forEach(promise => promise.value.rigidBody.useGravity = true);
        });
        dropButtonBehavior.onClick('released', (userId) => {
            dropTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
        // Reset Button
        const resetBoxActor = await mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Box,
                dimensions: { x: 0.7, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                name: 'Reset Box',
                transform: {
                    position: { x: -9, y: 1, z: 7 }
                }
            }
        });
        const resetTextActor = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                parentId: resetBoxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Reset",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        });
        await resetBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        await resetBoxActor.createAnimation('contract', {
            keyframes: this.contractAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create contract animation: ${reason}`));
        const resetButtonBehavior = resetBoxActor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        resetButtonBehavior.onHover('enter', (userId) => {
            resetBoxActor.enableAnimation('expand');
        });
        resetButtonBehavior.onHover('exit', (userId) => {
            resetBoxActor.enableAnimation('contract');
        });
        resetButtonBehavior.onClick('pressed', (userId) => {
            resetTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };
            this.sphereActorPromises.forEach(promise => promise.value.destroy());
            this.setupSphereActors();
        });
        resetButtonBehavior.onClick('released', (userId) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
    }
    async setupLight() {
        const helmetActor = await mixed_reality_extension_sdk_1.Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/DamagedHelmet.glb`,
            actor: {
                transform: {
                    position: { x: -8, y: 0.5, z: -7 }
                }
            }
        });
        const lightParentActor = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: helmetActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });
        await lightParentActor.createAnimation('spin', {
            wrapMode: mixed_reality_extension_sdk_1.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, mixed_reality_extension_sdk_1.Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        lightParentActor.enableAnimation("spin");
        await mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Sphere,
                radius: 0.2
            },
            actor: {
                parentId: lightParentActor.id,
                transform: {
                    position: { x: 3, y: 0, z: 0 }
                },
                light: { type: 'point', intensity: 4, range: 10 }
            }
        });
    }
    async setupTeleporter() {
        const teleporterActor = await mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "Teleporter: 1133592462367917034",
            actor: {
                name: 'teleporter',
                transform: {
                    position: { x: 7, y: -1.6, z: 7 }
                }
            }
        });
        await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'teleporter text',
                parentId: teleporterActor.id,
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    contents: "Teleporter Test World",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        });
    }
    async setupVideoPlayer() {
        const videoPlayer = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'video player',
                transform: {
                    position: { x: 0, y: 0.5, z: -6 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), 180 * mixed_reality_extension_sdk_1.DegreesToRadians),
                    scale: { x: 2, y: 2, z: 2 }
                },
            }
        });
        this.videoPlayerManager.play(videoPlayer.id, 'http://www.youtube.com/watch?v=L_LUpnjgPso&t=33s', 0.0);
    }
    async setupSphereActors() {
        this.sphereActorPromises = [];
        for (let x = -12; x <= -8; x = x + 2) {
            for (let y = 5; y <= 15; y = y + 1) {
                for (let z = 10; z <= 15; z = z + 2) {
                    const sphereActorPromise = mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: mixed_reality_extension_sdk_1.PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            materialId: this.assetGroup.materials.byIndex(1).id,
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
    generateSpinKeyframes(duration, axis) {
        return [{
                time: 0 * duration,
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 0) } }
            }, {
                time: 0.5 * duration,
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 180 * mixed_reality_extension_sdk_1.DegreesToRadians) } }
            }, {
                time: 1 * duration,
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 360 * mixed_reality_extension_sdk_1.DegreesToRadians) } }
            }];
    }
}
exports.default = Demo;
//# sourceMappingURL=app.js.map
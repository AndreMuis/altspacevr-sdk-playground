"use strict";
// have to use await for Cesium Man
// pressed event called twice
// no animations on local
// url: for gtlf doesn't work
// GltfGen crashes on prod (triangles)
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
        this.isCesiumManWalking = false;
        this.skullActor = null;
        this.sphereActors = [];
        this.frogActor = null;
        this.logActor = null;
        this.userJoined = async (user) => {
            this.addToLog(user.name);
            this.skullActor.lookAt(user, mixed_reality_extension_sdk_1.LookAtMode.TargetXY);
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
        this.videoPlayerManager = new mixed_reality_extension_altspacevr_extras_1.VideoPlayerManager(context);
        this.context.onStarted(() => this.started());
        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);
    }
    started() {
        this.setupScene();
        this.setupCesiumMan();
        this.setupSkull();
        this.setupSpheres();
        this.setupGlTF();
        this.setupTeleporter();
        this.setupVideoPlayer();
        // setInterval(this.moveFrog, 1000);
    }
    moveFrog() {
        console.log("tick");
    }
    addToLog(message) {
        console.log(message);
        this.logActor.text.contents = message + "\n" + this.logActor.text.contents;
    }
    setupScene() {
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
        mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Plane,
                dimensions: { x: 1000, y: 0, z: 1000 },
                uSegments: 1,
                vSegments: 1
            },
            addCollider: true,
            actor: {
                name: 'Plane',
                transform: {
                    position: { x: 0, y: -1.6, z: 0 }
                }
            }
        });
        // Cabin
        mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "993646440251130011",
            actor: {
                name: 'Cabin',
                transform: {
                    position: { x: 15, y: -1, z: 0.0 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), -90 * mixed_reality_extension_sdk_1.DegreesToRadians),
                    scale: { x: 0.8, y: 0.8, z: 0.8 }
                }
            }
        });
        // Frog
        const frogActorPromise = mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "986410508452102645",
            actor: {
                name: 'Frog',
                transform: {
                    position: { x: 0, y: -1.3, z: 0 },
                    scale: { x: 2, y: 2, z: 2 }
                }
            }
        });
        this.frogActor = frogActorPromise.value;
        // Log
        const logActorPromise = mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    position: { x: -3, y: 0, z: 0 },
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
        this.logActor = logActorPromise.value;
    }
    async setupCesiumMan() {
        const cesiumManActor = await mixed_reality_extension_sdk_1.Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1, z: 5 },
                }
            }
        });
        const boxActorPromise = mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Box,
                dimensions: { x: 1.5, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                name: 'Box',
                transform: {
                    position: { x: 0.0, y: 1, z: 5 }
                }
            }
        });
        const boxActor = boxActorPromise.value;
        const textActorPromise = mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
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
        const textActor = textActorPromise.value;
        boxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        boxActor.createAnimation('contract', {
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
    setupSkull() {
        const skullParentActorPromise = mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Skull Parent',
                transform: {
                    position: { x: 15, y: 0, z: 0 }
                }
            }
        });
        const skullParentActor = skullParentActorPromise.value;
        skullParentActor.createAnimation('spin', {
            wrapMode: mixed_reality_extension_sdk_1.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, mixed_reality_extension_sdk_1.Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        skullParentActor.enableAnimation("spin");
        const skullActorPromise = mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "1050090527044666141",
            actor: {
                name: 'Skull',
                parentId: skullParentActor.id,
                transform: {
                    position: { x: 0, y: 6, z: 9 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), 180 * mixed_reality_extension_sdk_1.DegreesToRadians),
                    scale: { x: 2, y: 2, z: 2 }
                }
            }
        });
        this.skullActor = skullActorPromise.value;
    }
    setupSpheres() {
        this.setupSphereActors();
        // Drop Button
        const dropBoxActorPromise = mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Box,
                dimensions: { x: 0.6, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                name: 'Drop Box',
                transform: {
                    position: { x: -10, y: 1, z: 5 }
                }
            }
        });
        const dropBoxActor = dropBoxActorPromise.value;
        const dropTextActorPromise = mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
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
        const dropTextActor = dropTextActorPromise.value;
        dropBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        dropBoxActor.createAnimation('contract', {
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
            this.sphereActors.forEach(actor => actor.value.rigidBody.useGravity = true);
        });
        dropButtonBehavior.onClick('released', (userId) => {
            dropTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
        // Reset Button
        const resetBoxActorPromise = mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Box,
                dimensions: { x: 0.7, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                name: 'Reset Box',
                transform: {
                    position: { x: -9, y: 1, z: 5 }
                }
            }
        });
        const resetBoxActor = resetBoxActorPromise.value;
        const resetTextActorPromise = mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
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
        const resetTextActor = resetTextActorPromise.value;
        resetBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        resetBoxActor.createAnimation('contract', {
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
            this.sphereActors.forEach(actor => actor.value.destroy());
            this.setupSphereActors();
        });
        resetButtonBehavior.onClick('released', (userId) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
    }
    async setupGlTF() {
        // Beach Ball
        /*
        const material = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/beach-ball.png`
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);

        const blobURL = Server.registerStaticBuffer('beachball', gltfFactory.generateGLTF());

        const mats = await this.context.assets.loadGltf('beachball', blobURL);

        await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Sphere,
                radius: 1
            },
            actor: {
                materialId: mats.materials.byIndex(0).id,
                transform: {
                    position: { x: -3, y: 1, z: -6 }
                }
            }
        });
        */
        // Triangles
        const prim1 = new GltfGen.MeshPrimitive({
            vertices: [
                new GltfGen.Vertex({ position: [0, 0, 0] }),
                new GltfGen.Vertex({ position: [1, 0, 0] }),
                new GltfGen.Vertex({ position: [0, 1, 0] })
            ],
            triangles: [0, 1, 2],
            material: new GltfGen.Material({ name: 'red' })
        });
        const prim2 = new GltfGen.MeshPrimitive({
            material: new GltfGen.Material({ name: 'blue' })
        }, prim1);
        const factory1 = new GltfGen.GltfFactory([new GltfGen.Scene({
                nodes: [
                    new GltfGen.Node({
                        mesh: new GltfGen.Mesh({
                            primitives: [prim1]
                        })
                    }),
                    new GltfGen.Node({
                        mesh: new GltfGen.Mesh({
                            primitives: [prim2]
                        })
                    })
                ]
            })]);
        mixed_reality_extension_sdk_1.Actor.CreateFromGltf(this.context, {
            resourceUrl: server_1.default.registerStaticBuffer('triangles.glb', factory1.generateGLTF()),
            actor: {
                transform: {
                    position: { x: -3, y: 0, z: -9 },
                }
            }
        });
        // Triangle
        const prim = new GltfGen.MeshPrimitive({
            vertices: [
                new GltfGen.Vertex({ position: [0, 0, 0], texCoord0: [0, 0] }),
                new GltfGen.Vertex({ position: [1, 0, 0], texCoord0: [1, 0] }),
                new GltfGen.Vertex({ position: [0, 1, 0], texCoord0: [0, 1] })
            ],
            triangles: [0, 1, 2]
        });
        const factory2 = GltfGen.GltfFactory.FromSinglePrimitive(prim).generateGLTF();
        mixed_reality_extension_sdk_1.Actor.CreateFromGltf(this.context, {
            resourceUrl: server_1.default.registerStaticBuffer('triangle.glb', factory2),
            actor: {
                transform: {
                    position: { x: -3, y: 0, z: -10 },
                }
            }
        });
    }
    setupTeleporter() {
        const teleporterPromise = mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "Teleporter: 1133592462367917034",
            actor: {
                name: 'teleporter',
                transform: {
                    position: { x: 5, y: -0.75, z: 5 }
                }
            }
        });
        const textActorPromise = mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'teleporter text',
                parentId: teleporterPromise.value.id,
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
                    position: { x: 0, y: 1, z: -7 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), 180 * mixed_reality_extension_sdk_1.DegreesToRadians),
                    scale: { x: 5, y: 5, z: 5 }
                },
            }
        });
        this.videoPlayerManager.play(videoPlayer.id, 'https://www.youtube.com/watch?v=L_LUpnjgPso&t=33s', 0.0);
    }
    setupSphereActors() {
        this.sphereActors = [];
        for (let x = -12; x <= -8; x = x + 2) {
            for (let y = 5; y <= 15; y = y + 1) {
                for (let z = 8; z <= 13; z = z + 2) {
                    const actor = mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: mixed_reality_extension_sdk_1.PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            transform: {
                                position: {
                                    x: x + Math.random() / 2.0,
                                    y: y,
                                    z: z + Math.random() / 2.0
                                }
                            }
                        }
                    });
                    this.sphereActors.push(actor);
                }
            }
        }
        this.sphereActors.forEach(actor => actor.value.enableRigidBody({
            useGravity: false
        }));
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
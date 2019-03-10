"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const MRESDK = __importStar(require("@microsoft/mixed-reality-extension-sdk"));
const MREEXT = __importStar(require("@microsoft/mixed-reality-extension-altspacevr-extras"));
class Demo {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.lastUser = null;
        this.grassMaterial = null;
        this.beachBallMaterial = null;
        this.userHeadActor = null;
        this.isCesiumManWalking = false;
        this.cabinActor = null;
        this.skullActor = null;
        this.sphereActorPromises = [];
        this.logActor = null;
        this.userJoined = async (user) => {
            this.lastUser = user;
            if (this.skullActor != null) {
                await this.setupUserAttachments();
                this.skullActor.enableLookAt(this.userHeadActor, MRESDK.LookAtMode.TargetXY, true);
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
        this.videoPlayerManager = new MREEXT.VideoPlayerManager(context);
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
            await this.setupUserAttachments();
            this.skullActor.enableLookAt(this.userHeadActor, MRESDK.LookAtMode.TargetXY, true);
        }
    }
    addToLog(message) {
        console.log(message);
        if (this.logActor != null) {
            this.logActor.text.contents = message + "\n" + this.logActor.text.contents;
        }
    }
    async loadMaterials() {
        const beachBallTexture = await this.context.assetManager.createTexture('beach-ball', {
            uri: `${this.baseUrl}/beach-ball.png`
        });
        this.beachBallMaterial = await this.context.assetManager.createMaterial('beach-ball', {
            mainTextureId: beachBallTexture.id
        });
        const grassTexture = await this.context.assetManager.createTexture('grass', {
            uri: `${this.baseUrl}/grass.png`
        });
        this.grassMaterial = await this.context.assetManager.createMaterial('grass', {
            mainTextureId: grassTexture.id
        });
    }
    async setupUserAttachments() {
        this.userHeadActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                attachment: {
                    userId: this.lastUser.id,
                    attachPoint: 'head'
                }
            }
        });
    }
    async setupScene() {
        // Title
        MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 5, z: 8 }
                },
                text: {
                    contents: "SDK Playground",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 255 / 255, g: 255 / 255, b: 255 / 255 },
                    height: 1.0
                }
            }
        });
        // Ground
        this.grassMaterial.mainTextureScale.set(10, 10);
        MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Plane,
                dimensions: { x: 100, y: 0, z: 100 }
            },
            addCollider: true,
            actor: {
                materialId: this.grassMaterial.id,
                transform: {
                    position: { x: 0, y: -1.6, z: 0 }
                }
            }
        });
        // Cabin
        this.cabinActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "artifact:993646440251130011",
            actor: {
                transform: {
                    position: { x: 20, y: -1.5, z: 0.0 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians),
                    scale: { x: 0.8, y: 0.8, z: 0.8 }
                }
            }
        });
        // Log
        this.logActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    position: { x: -5, y: 0, z: 0 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians)
                },
                text: {
                    contents: "log start",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.1
                }
            }
        });
    }
    async setupCesiumMan() {
        const cesiumManActor = await MRESDK.Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1.6, z: 7 },
                    scale: { x: 1.5, y: 1.5, z: 1.5 }
                }
            }
        });
        const boxActor = await MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: 1.5, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                transform: {
                    position: { x: 0.0, y: 1.2, z: 7 }
                }
            }
        });
        const textActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: boxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Start Walking",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
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
        const buttonBehavior = boxActor.setBehavior(MRESDK.ButtonBehavior);
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
        const skullParentActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: this.cabinActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });
        await skullParentActor.createAnimation('spin', {
            wrapMode: MRESDK.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, MRESDK.Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        skullParentActor.enableAnimation("spin");
        this.skullActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "artifact:1050090527044666141",
            actor: {
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
        const dropBoxActor = await MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: 0.6, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                transform: {
                    position: { x: -10, y: 1, z: 7 }
                }
            }
        });
        const dropTextActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: dropBoxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Drop",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
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
        const dropButtonBehavior = dropBoxActor.setBehavior(MRESDK.ButtonBehavior);
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
        const resetBoxActor = await MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: 0.7, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                transform: {
                    position: { x: -9, y: 1, z: 7 }
                }
            }
        });
        const resetTextActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: resetBoxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Reset",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
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
        const resetButtonBehavior = resetBoxActor.setBehavior(MRESDK.ButtonBehavior);
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
        const helmetActor = await MRESDK.Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/DamagedHelmet.glb`,
            actor: {
                transform: {
                    position: { x: -10, y: 0.5, z: -10 }
                }
            }
        });
        const lightParentActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: helmetActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });
        await lightParentActor.createAnimation('spin', {
            wrapMode: MRESDK.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, MRESDK.Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        lightParentActor.enableAnimation("spin");
        await MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
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
        const teleporterActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "teleporter:1133592462367917034",
            actor: {
                transform: {
                    position: { x: 7, y: -1.6, z: 7 }
                }
            }
        });
        await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: teleporterActor.id,
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    contents: "Teleporter Test World",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        });
    }
    async setupVideoPlayer() {
        const videoPlayer = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 0.5, z: -6 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 180 * MRESDK.DegreesToRadians),
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
                    const sphereActorPromise = MRESDK.Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: MRESDK.PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            materialId: this.beachBallMaterial.id,
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
                value: { transform: { rotation: MRESDK.Quaternion.RotationAxis(axis, 0) } }
            }, {
                time: 0.5 * duration,
                value: { transform: { rotation: MRESDK.Quaternion.RotationAxis(axis, 180 * MRESDK.DegreesToRadians) } }
            }, {
                time: 1 * duration,
                value: { transform: { rotation: MRESDK.Quaternion.RotationAxis(axis, 360 * MRESDK.DegreesToRadians) } }
            }];
    }
}
exports.default = Demo;
//# sourceMappingURL=app.js.map
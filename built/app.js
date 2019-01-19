"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
class Demo {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.isCesiumManWalking = false;
        this.sphereActors = [];
        this.frogActor = null;
        this.logActor = null;
        this.userJoined = async (user) => {
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
    }
    started() {
        this.setupScene();
        this.setupCesiumMan();
        this.setupSkull();
        this.setupSpheres();
        // setInterval(this.moveFrog, 1000);
    }
    moveFrog() {
        console.log("tick");
        this.addToLog(Date.now().toString());
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
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), -Math.PI / 2.0),
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
                    position: { x: -3, y: 0, z: -3 },
                    rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(mixed_reality_extension_sdk_1.Vector3.Up(), -Math.PI / 2.0)
                },
                text: {
                    contents: "log contents",
                    anchor: mixed_reality_extension_sdk_1.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.1
                }
            }
        });
        this.logActor = logActorPromise.value;
    }
    async setupCesiumMan() {
        const cesiumManActor = await mixed_reality_extension_sdk_1.Actor.CreateFromGLTF(this.context, {
            resourceUrl: `https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`,
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
        boxActor.createAnimation({
            animationName: 'expand',
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        boxActor.createAnimation({
            animationName: 'contract',
            keyframes: this.contractAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create contract animation: ${reason}`));
        const buttonBehavior = boxActor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        buttonBehavior.onHover('enter', (userId) => {
            boxActor.startAnimation('expand');
        });
        buttonBehavior.onHover('exit', (userId) => {
            boxActor.startAnimation('contract');
        });
        buttonBehavior.onClick('pressed', (userId) => {
            textActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };
            if (this.isCesiumManWalking == true) {
                this.isCesiumManWalking = false;
                textActor.text.contents = "Start Walking";
                cesiumManActor.stopAnimation('animation:0');
            }
            else {
                this.isCesiumManWalking = true;
                textActor.text.contents = "Stop Walking";
                cesiumManActor.startAnimation('animation:0');
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
        skullParentActor.createAnimation({
            animationName: 'spin',
            wrapMode: mixed_reality_extension_sdk_1.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, mixed_reality_extension_sdk_1.Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        skullParentActor.startAnimation("spin");
        mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "1050090527044666141",
            actor: {
                name: 'Skull',
                parentId: skullParentActor.id,
                transform: {
                    position: { x: 0, y: 6, z: 9 },
                    scale: { x: 2, y: 2, z: 2 }
                }
            }
        });
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
                name: 'Box',
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
        dropBoxActor.createAnimation({
            animationName: 'expand',
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        dropBoxActor.createAnimation({
            animationName: 'contract',
            keyframes: this.contractAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create contract animation: ${reason}`));
        const dropButtonBehavior = dropBoxActor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        dropButtonBehavior.onHover('enter', (userId) => {
            dropBoxActor.startAnimation('expand');
        });
        dropButtonBehavior.onHover('exit', (userId) => {
            dropBoxActor.startAnimation('contract');
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
                name: 'Box',
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
        resetBoxActor.createAnimation({
            animationName: 'expand',
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));
        resetBoxActor.createAnimation({
            animationName: 'contract',
            keyframes: this.contractAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create contract animation: ${reason}`));
        const resetButtonBehavior = resetBoxActor.setBehavior(mixed_reality_extension_sdk_1.ButtonBehavior);
        resetButtonBehavior.onHover('enter', (userId) => {
            resetBoxActor.startAnimation('expand');
        });
        resetButtonBehavior.onHover('exit', (userId) => {
            resetBoxActor.startAnimation('contract');
        });
        resetButtonBehavior.onClick('pressed', (userId) => {
            resetTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };
            this.sphereActors.forEach(actor => actor.value.destroy());
            this.setupSphereActors();
        });
        resetButtonBehavior.onClick('released', (userId) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
        return true;
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
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, Math.PI) } }
            }, {
                time: 1 * duration,
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 2.0 * Math.PI) } }
            }];
    }
}
exports.default = Demo;
//# sourceMappingURL=app.js.map
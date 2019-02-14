import {
    Actor,
    AnimationKeyframe,
    AnimationWrapMode,
    ButtonBehavior,
    Context,
    DegreesToRadians,
    ForwardPromise,
    LookAtMode,
    PrimitiveShape,
    Quaternion,
    TextAnchorLocation,
    User,
    Vector3,
    AssetGroup,
    Material
} from '@microsoft/mixed-reality-extension-sdk';

import {
    VideoPlayerManager
} from '@microsoft/mixed-reality-extension-altspacevr-extras';

import * as GltfGen from '@microsoft/gltf-gen';

import Server from './server'

export default class Demo {
    private assetGroup: AssetGroup = null;
    private lastUser: User = null;

    private isCesiumManWalking: Boolean = false;
    private cabinActor: Actor = null;
    private skullActor: Actor = null;
    private sphereActorPromises: Array<ForwardPromise<Actor>> = [];
    private videoPlayerManager: VideoPlayerManager;
    private logActor: Actor = null;

    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());

        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);

        this.videoPlayerManager = new VideoPlayerManager(context)
    }
    
    private async started() {
        await this.loadMaterials();

        await this.setupScene();
        await this.setupCesiumMan();
        await this.setupSkull();
        await this.setupSpheres();
        await this.setupLight();
        await this.setupTeleporter();
        await this.setupVideoPlayer();

        if (this.lastUser != null) {
            this.skullActor.lookAt(this.lastUser, LookAtMode.TargetXY);
        }
    }

    private userJoined = async (user: User) => {
        this.lastUser = user;

        if (this.skullActor != null) {
            this.skullActor.lookAt(this.lastUser, LookAtMode.TargetXY);
        }

        this.addToLog(user.name);
    }

    private addToLog(message: String) {
        console.log(message);

        if (this.logActor != null) { 
            this.logActor.text.contents = message + "\n" + this.logActor.text.contents;
        }
    }

    private async loadMaterials()
    {
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

        const buffer = Server.registerStaticBuffer('gltf-buffer', gltfFactory.generateGLTF());
    
        this.assetGroup = await this.context.assetManager.loadGltf('gltf-buffer', buffer);
    }

    public async setupScene()
    {
        // Title
        Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    position: { x: 0, y: 5, z: 8 }
                },
                text: {
                    contents: "SDK Playground",
                    anchor: TextAnchorLocation.MiddleCenter,
                    color: { r: 255 / 255, g: 255 / 255, b: 255 / 255 },
                    height: 1.0
                }
            }
        });

        // Ground
        const grassMaterial: Material = this.assetGroup.materials.byIndex(0);
        grassMaterial.mainTextureScale.set(1000, 1000);

        Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Plane,
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
        this.cabinActor = await Actor.CreateFromLibrary(this.context, {
            resourceId: "993646440251130011",
            actor: {
                name: 'Cabin',
                transform: {
                    position: { x: 20, y: -1.5, z: 0.0 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), -90 * DegreesToRadians),
                    scale: { x: 0.8, y: 0.8, z: 0.8}
                }
            }
        });

        // Log
        this.logActor = await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    position: { x: -5, y: 0, z: 0 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), -90 * DegreesToRadians)
                },
                text: {
                    contents: "log start",
                    anchor: TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.1
                }
            }
        });
    }

    private async setupCesiumMan()
    {
        const cesiumManActor = await Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1.6, z: 7 },
                    scale: {x: 1.5, y: 1.5, z: 1.5}
                }
            }
        });

        const boxActor = await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Box,
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

        const textActor = await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                parentId: boxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Start Walking",
                    anchor: TextAnchorLocation.MiddleCenter,
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

        const buttonBehavior = boxActor.setBehavior(ButtonBehavior);

        buttonBehavior.onHover('enter', (userId: string) => {
            boxActor.enableAnimation('expand');
        });

        buttonBehavior.onHover('exit', (userId: string) => {
            boxActor.enableAnimation('contract');
        });

        buttonBehavior.onClick('pressed', (userId: string) => {
            textActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };

            if (this.isCesiumManWalking == true)
            {
                this.isCesiumManWalking = false;
                textActor.text.contents = "Start Walking";
                cesiumManActor.disableAnimation('animation:0');
            }
            else
            {
                this.isCesiumManWalking = true;   
                textActor.text.contents = "Stop Walking";
                cesiumManActor.enableAnimation('animation:0');
            } 
        });

        buttonBehavior.onClick('released', (userId: string) => {
            textActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
    }

    private async setupSkull()
    {
        const skullParentActor = await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Skull Parent',
                parentId: this.cabinActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });

        await skullParentActor.createAnimation('spin', {
            wrapMode: AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        
        skullParentActor.enableAnimation("spin");
    
        this.skullActor = await Actor.CreateFromLibrary(this.context, {
            resourceId: "986410464940392936", // 1050090527044666141
            actor: {
                name: 'frog',
                parentId: skullParentActor.id,
                transform: {
                    position: { x: 0, y: 6, z: 9 },
                    scale: { x: 6, y: 6, z: 6}
                }
            }
        });
    }

    public async setupSpheres() {
        this.setupSphereActors()

        // Drop Button
        const dropBoxActor = await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Box,
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

        const dropTextActor = await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                parentId: dropBoxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Drop",
                    anchor: TextAnchorLocation.MiddleCenter,
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

        const dropButtonBehavior = dropBoxActor.setBehavior(ButtonBehavior);

        dropButtonBehavior.onHover('enter', (userId: string) => {
            dropBoxActor.enableAnimation('expand');
        });

        dropButtonBehavior.onHover('exit', (userId: string) => {
            dropBoxActor.enableAnimation('contract');
        });

        dropButtonBehavior.onClick('pressed', (userId: string) => {
            dropTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };

            this.sphereActorPromises.forEach(promise => promise.value.rigidBody.useGravity = true);
        });

        dropButtonBehavior.onClick('released', (userId: string) => {
            dropTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });

        // Reset Button
        const resetBoxActor = await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Box,
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

        const resetTextActor = await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                parentId: resetBoxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Reset",
                    anchor: TextAnchorLocation.MiddleCenter,
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

        const resetButtonBehavior = resetBoxActor.setBehavior(ButtonBehavior);

        resetButtonBehavior.onHover('enter', (userId: string) => {
            resetBoxActor.enableAnimation('expand');
        });

        resetButtonBehavior.onHover('exit', (userId: string) => {
            resetBoxActor.enableAnimation('contract');
        });

        resetButtonBehavior.onClick('pressed', (userId: string) => {
            resetTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };

            this.sphereActorPromises.forEach(promise => promise.value.destroy());

            this.setupSphereActors();
        });

        resetButtonBehavior.onClick('released', (userId: string) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
    }

    public async setupLight() {
        const helmetActor = await Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/DamagedHelmet.glb`,
            actor: {
                transform: {
                    position: { x: -10, y: 0.5, z: -10 }
                }
            }
        });

        const lightParentActor = await Actor.CreateEmpty(this.context, {
            actor: {
                parentId: helmetActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });

        await lightParentActor.createAnimation('spin', {
            wrapMode: AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));

        lightParentActor.enableAnimation("spin");
    
        await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Sphere,
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

    private async setupTeleporter() {
        const teleporterActor = await Actor.CreateFromLibrary(this.context, {
            resourceId: "Teleporter: 1133592462367917034",
            actor: {
                name: 'teleporter',
                transform: {
                    position: { x: 7, y: -1.6, z: 7 }
                }
            }
        });

        await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'teleporter text',
                parentId: teleporterActor.id,
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    contents: "Teleporter Test World",
                    anchor: TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        });
    }

    private async setupVideoPlayer() 
    {
        const videoPlayer = await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'video player',
                transform: {
                    position: { x: 0, y: 0.5, z: -6 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), 180 * DegreesToRadians),
                    scale: { x: 2, y: 2, z: 2 }
                },
            }
        });

        this.videoPlayerManager.play(
            videoPlayer.id,
            'http://www.youtube.com/watch?v=L_LUpnjgPso&t=33s',
            0.0);
    }

    private async setupSphereActors()
    {
        this.sphereActorPromises = [];

        for (let x = -12; x <= -8; x = x + 2) {
            for (let y = 5; y <= 15; y = y + 1) {
                for (let z = 10; z <= 15; z = z + 2) {
                    const sphereActorPromise = Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            materialId: this.assetGroup.materials.byIndex(1).id,
                            transform: {
                                position: {
                                    x: x + Math.random() / 2.0, 
                                    y: y, 
                                    z: z + Math.random() / 2.0}
                            }
                        }
                    });

                    this.sphereActorPromises.push(sphereActorPromise);
                }
            }
        }

        this.sphereActorPromises.forEach(promise => promise.value.enableRigidBody( { useGravity: false } ));
    }

    private generateSpinKeyframes(duration: number, axis: Vector3): AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { rotation: Quaternion.RotationAxis(axis, 0) } }
        }, {
            time: 0.5 * duration,
            value: { transform: { rotation: Quaternion.RotationAxis(axis, 180 * DegreesToRadians) } }
        }, {
            time: 1 * duration,
            value: { transform: { rotation: Quaternion.RotationAxis(axis, 360 * DegreesToRadians) } }
        }];
    }

    private expandAnimationData: AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 1, y: 1, z: 1 } } }
    }, {
        time: 0.2,
        value: { transform: { scale: { x: 1.1, y: 1.1, z: 1.1 } } }
    }];

    private contractAnimationData: AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 1.1, y: 1.1, z: 1.1 } } }
    }, {
        time: 0.2,
        value: { transform: { scale: { x: 1, y: 1, z: 1 } } }
    }];
}

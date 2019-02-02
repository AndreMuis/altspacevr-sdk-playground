// have to use await for Cesium Man
// pressed event called twice
// no animations on local
// url: for gtlf doesn't work
// GltfGen crashes on prod (triangles)

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
    Vector3
} from '@microsoft/mixed-reality-extension-sdk';

import {
    VideoPlayerManager
} from '@microsoft/mixed-reality-extension-altspacevr-extras';

import * as GltfGen from '@microsoft/gltf-gen';

import { resolve } from 'path';

import Server from './server'

export default class Demo {
    private baseURLTranslated: String = '';

    private isCesiumManWalking: Boolean = false;
    private skullActor: Actor = null;
    private sphereActors: Array<ForwardPromise<Actor>> = [];
    private frogActor: Actor = null;
    private videoPlayerManager: VideoPlayerManager;
    private logActor: Actor = null;

    constructor(private context: Context, private baseUrl: string) {
        this.videoPlayerManager = new VideoPlayerManager(context);

        this.context.onStarted(() => this.started());

        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);

        if (this.context.sessionId == 'local') {
            this.baseURLTranslated = 'http://127.0.0.1:3901';
        } else if (this.context.sessionId == 'production') {
            this.baseURLTranslated = 'https://altspacevr-demo.herokuapp.com';
        } else {
            console.log('session id is invalid. session id = ' + this.context.sessionId);
        }
    }

    private started() {
        // this.setupScene();
        this.setupCesiumMan();
        // this.setupSkull();
        // this.setupSpheres();
        // this.setupGlTF();
        // this.setupTeleporter();
        // this.setupVideoPlayer();

        // setInterval(this.moveFrog, 1000);
    }

    private userJoined = async (user: User) => {
        this.addToLog(user.name);

        this.skullActor.lookAt(user, LookAtMode.TargetXY);
    }

    private moveFrog() {
        console.log("tick");
    }

    private addToLog(message: String) {
        console.log(message);
        this.logActor.text.contents = message + "\n" + this.logActor.text.contents;
    }

    public setupScene()
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
        Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Plane,
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
        Actor.CreateFromLibrary(this.context, {
            resourceId: "993646440251130011",
            actor: {
                name: 'Cabin',
                transform: {
                    position: { x: 15, y: -1, z: 0.0 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), -90 * DegreesToRadians),
                    scale: { x: 0.8, y: 0.8, z: 0.8}
                }
            }
        });

        // Frog
        const frogActorPromise = Actor.CreateFromLibrary(this.context, {
            resourceId: "986410508452102645",
            actor: {
                name: 'Frog',
                transform: {
                    position: { x: 0, y: -1.3, z: 0 },
                    scale: { x: 2, y: 2, z: 2}
                }
            }
        });
        this.frogActor = frogActorPromise.value;

        // Log
        const logActorPromise = Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Text',
                transform: {
                    position: { x: -3, y: 0, z: 0 },
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
        this.logActor = logActorPromise.value;
    }

    private async setupCesiumMan()
    {
        const cesiumManActor = await Actor.CreateFromGltf(this.context, {
            // resourceUrl: 'https://rawcdn.githack.com/AndreMuis/altspacevr-demo/9aaefea676e1fe7545188052cc0dd1e9170d056a/public/CesiumMan.glb',
            // resourceUrl: `${this.baseUrl}/CesiumMan.glb`,
            resourceUrl: `${this.baseURLTranslated}/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1, z: 5 },
                }
            }
        });

        const boxActorPromise = Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Box,
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

        const textActorPromise = Actor.CreateEmpty(this.context, {
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
        const textActor = textActorPromise.value;

        boxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));

        boxActor.createAnimation('contract', {
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

    private setupSkull()
    {
        const skullParentActorPromise = Actor.CreateEmpty(this.context, {
            actor: {
                name: 'Skull Parent',
                transform: {
                    position: { x: 15, y: 0, z: 0 }
                }
            }
        });
        const skullParentActor = skullParentActorPromise.value;

        skullParentActor.createAnimation('spin', {
            wrapMode: AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        
        skullParentActor.enableAnimation("spin");
    
        const skullActorPromise = Actor.CreateFromLibrary(this.context, {
            resourceId: "1050090527044666141",
            actor: {
                name: 'Skull',
                parentId: skullParentActor.id,
                transform: {
                    position: { x: 0, y: 6, z: 9 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), 180 * DegreesToRadians),
                    scale: { x: 2, y: 2, z: 2}
                }
            }
        });
        this.skullActor = skullActorPromise.value; 
    }

    public setupSpheres() {
        this.setupSphereActors()

        // Drop Button
        const dropBoxActorPromise = Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Box,
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

        const dropTextActorPromise = Actor.CreateEmpty(this.context, {
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
        const dropTextActor = dropTextActorPromise.value;

        dropBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));

        dropBoxActor.createAnimation('contract', {
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

            this.sphereActors.forEach(actor => actor.value.rigidBody.useGravity = true);
        });

        dropButtonBehavior.onClick('released', (userId: string) => {
            dropTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });

        // Reset Button
        const resetBoxActorPromise = Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Box,
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

        const resetTextActorPromise = Actor.CreateEmpty(this.context, {
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
        const resetTextActor = resetTextActorPromise.value;

        resetBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create expand animation: ${reason}`));

        resetBoxActor.createAnimation('contract', {
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

            this.sphereActors.forEach(actor => actor.value.destroy());

            this.setupSphereActors();
        });

        resetButtonBehavior.onClick('released', (userId: string) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });
    }

    private async setupGlTF()
    {
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

        const factory1 = new GltfGen.GltfFactory(
            [new GltfGen.Scene({
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
            })]
        );

        Actor.CreateFromGltf(this.context, {
            resourceUrl: Server.registerStaticBuffer('triangles.glb', factory1.generateGLTF()),
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
    
        Actor.CreateFromGltf(this.context, {
            resourceUrl: Server.registerStaticBuffer('triangle.glb', factory2),
            actor: {
                transform: {
                    position: { x: -3, y: 0, z: -10 },
                }
            }
        });
    }

    private setupTeleporter() {
        const teleporterPromise = Actor.CreateFromLibrary(this.context, {
            resourceId: "Teleporter: 1133592462367917034",
            actor: {
                name: 'teleporter',
                transform: {
                    position: { x: 5, y: -0.75, z: 5 }
                }
            }
        });

        const textActorPromise = Actor.CreateEmpty(this.context, {
            actor: {
                name: 'teleporter text',
                parentId: teleporterPromise.value.id,
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
                    position: { x: 0, y: 1, z: -7 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), 180 * DegreesToRadians),
                    scale: { x: 5, y: 5, z: 5 }
                },
            }
        });

        this.videoPlayerManager.play(
            videoPlayer.id,
            'https://www.youtube.com/watch?v=L_LUpnjgPso&t=33s',
            0.0);
    }

    private setupSphereActors()
    {
        this.sphereActors = [];

        for (let x = -12; x <= -8; x = x + 2) {
            for (let y = 5; y <= 15; y = y + 1) {
                for (let z = 8; z <= 13; z = z + 2) {
                    const actor = Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            transform: {
                                position: {
                                    x: x + Math.random() / 2.0, 
                                    y: y, 
                                    z: z + Math.random() / 2.0}
                            }
                        }
                    });

                    this.sphereActors.push(actor);
                }
            }
        }

        this.sphereActors.forEach(actor =>
            actor.value.enableRigidBody({
                useGravity: false
            })
        );
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

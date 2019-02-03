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

import { ENAMETOOLONG } from 'constants';
import { deflateSync } from 'zlib';

enum Environment {
    Unknown,
    Local,
    Production
}

export default class Demo {
    private environment: Environment = Environment.Unknown;
    
    get baseURLTranslated(): String {
        switch(this.environment) { 
            case Environment.Unknown: { 
                return ""; 
                break; 
             } 
             case Environment.Local: { 
               return 'http://127.0.0.1:3901'; 
               break; 
            } 
            case Environment.Production: { 
               return 'http://altspacevr-demo.herokuapp.com';
               break; 
            } 
         } 
    }

    private firstUser: User = null;

    private isCesiumManWalking: Boolean = false;
    private cabinActor: Actor = null;
    private skullActor: Actor = null;
    private sphereActorPromises: Array<ForwardPromise<Actor>> = [];
    private videoPlayerManager: VideoPlayerManager;
    private logActor: Actor = null;

    constructor(private context: Context, private baseUrl: string) {
        this.videoPlayerManager = new VideoPlayerManager(context);

        this.context.onStarted(() => this.started());

        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);

        if (this.context.sessionId == 'local') {
            this.environment = Environment.Local;
        } else if (this.context.sessionId == 'production') {
            this.environment = Environment.Production;
        } else {
            this.environment = Environment.Unknown;
            console.log('session id is invalid. session id = ' + this.context.sessionId);
        }
    }

    private async started() {
        await this.setupScene();
        await this.setupCesiumMan();
        await this.setupSkull();
        await this.setupSpheres();

        if (this.environment != Environment.Production) {
            await this.setupGlTF();
        }

        await this.setupTeleporter();
        await this.setupVideoPlayer();

        if (this.firstUser != null) {
            this.skullActor.lookAt(this.firstUser, LookAtMode.TargetXY);
        }
    }

    private userJoined = async (user: User) => {
        this.firstUser = user;

        if (this.firstUser != null) {
            this.skullActor.lookAt(this.firstUser, LookAtMode.TargetXY);
        }

        this.addToLog(user.name);
    }

    private addToLog(message: String) {
        console.log(message);

        if (this.logActor != null) { 
            this.logActor.text.contents = message + "\n" + this.logActor.text.contents;
        }
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
        this.cabinActor = await Actor.CreateFromLibrary(this.context, {
            resourceId: "993646440251130011",
            actor: {
                name: 'Cabin',
                transform: {
                    position: { x: 20, y: -1, z: 0.0 },
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
            resourceUrl: `${this.baseURLTranslated}/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1, z: 7 },
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
                    position: { x: 0.0, y: 1, z: 7 }
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

    private async setupGlTF()
    {
        // Beach Ball
        const material = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseURLTranslated}/beach-ball.png` 
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);

        const blobURL = Server.registerStaticBuffer('beachball', gltfFactory.generateGLTF());

        const mats = await this.context.assetManager.loadGltf('beachball', blobURL);

        await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Sphere,
                radius: 0.5
            },
            actor: {
                materialId: mats.materials.byIndex(0).id,
                transform: {
                    position: { x: -3, y: 0, z: -3 }
                }
            }
        });

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

        await Actor.CreateFromGltf(this.context, {
            resourceUrl: Server.registerStaticBuffer('triangles.glb', factory1.generateGLTF()),
            actor: {
                transform: {
                    position: { x: -3, y: 0, z: -6 },
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
    
        await Actor.CreateFromGltf(this.context, {
            resourceUrl: Server.registerStaticBuffer('triangle.glb', factory2),
            actor: {
                transform: {
                    position: { x: -3, y: 0, z: -7 },
                }
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
                    position: { x: 0, y: 1, z: -8 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), 180 * DegreesToRadians),
                    scale: { x: 2, y: 2, z: 2 }
                },
            }
        });

        this.videoPlayerManager.play(
            videoPlayer.id,
            'https://www.youtube.com/watch?v=L_LUpnjgPso&t=33s',
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

        for(const promise of this.sphereActorPromises)
        {
            promise.value.enableRigidBody( { useGravity: false } );
        }
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

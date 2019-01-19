import {
    Actor,
    AnimationKeyframe,
    AnimationWrapMode,
    ButtonBehavior,
    Context,
    ForwardPromise,
    PrimitiveShape,
    Quaternion,
    TextAnchorLocation,
    User,
    Vector3,
    DegreesToRadians,
    createForwardPromise
} from '@microsoft/mixed-reality-extension-sdk';

export default class HelloWorld {
    private isCesiumManWalking: Boolean = false;
    private sphereActors: Array<ForwardPromise<Actor>> = [];
    private frogActor: Actor = null;
    private logActor: Actor = null;

    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());

        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);
    }

    private started() {
        this.setupScene();
        this.setupCesiumMan();
        this.setupSkull();
        this.setupSpheres();

        setInterval(this.moveFrog, 1000);
    }

    private userJoined = async (user: User) => {
        this.addToLog(user.name);
    }

    private moveFrog() {
        console.log("tick");

        //this.addToLog(Date.now().toString());
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
                    rotation: Quaternion.RotationAxis(Vector3.Up(), -Math.PI / 2.0),
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
                    position: { x: -3, y: 0, z: -3 },
                    rotation: Quaternion.RotationAxis(Vector3.Up(), -Math.PI / 2.0)
                },
                text: {
                    contents: "log contents",
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
        const cesiumManActor = await Actor.CreateFromGLTF(this.context, {
            resourceUrl: `https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1, z: 5 },
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
                    position: { x: 0.0, y: 1, z: 5 }
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

        const buttonBehavior = boxActor.setBehavior(ButtonBehavior);

        buttonBehavior.onHover('enter', (userId: string) => {
            boxActor.startAnimation('expand');
        });

        buttonBehavior.onHover('exit', (userId: string) => {
            boxActor.startAnimation('contract');
        });

        buttonBehavior.onClick('pressed', (userId: string) => {
            textActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };

            if (this.isCesiumManWalking == true)
            {
                this.isCesiumManWalking = false;
                textActor.text.contents = "Start Walking";
                cesiumManActor.stopAnimation('animation:0');
            }
            else
            {
                this.isCesiumManWalking = true;   
                textActor.text.contents = "Stop Walking";
                cesiumManActor.startAnimation('animation:0');
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
                transform: {
                    position: { x: 15, y: 0, z: 0 }
                }
            }
        });
    
        skullParentActor.createAnimation({
            animationName: 'spin',
            wrapMode: AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
    
        skullParentActor.startAnimation("spin");
    
        await Actor.CreateFromLibrary(this.context, {
            resourceId: "1050090527044666141",
            actor: {
                name: 'Skull',
                parentId: skullParentActor.id,
                transform: {
                    position: { x: 0, y: 6, z: 9 },
                    scale: { x: 2, y: 2, z: 2}
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
                name: 'Box',
                transform: {
                    position: { x: -10, y: 1, z: 5 }
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

        const dropButtonBehavior = dropBoxActor.setBehavior(ButtonBehavior);

        dropButtonBehavior.onHover('enter', (userId: string) => {
            dropBoxActor.startAnimation('expand');
        });

        dropButtonBehavior.onHover('exit', (userId: string) => {
            dropBoxActor.startAnimation('contract');
        });

        dropButtonBehavior.onClick('pressed', (userId: string) => {
            dropTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };

            this.sphereActors.forEach(actor => actor.value.rigidBody.useGravity = true);
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
                name: 'Box',
                transform: {
                    position: { x: -9, y: 1, z: 5 }
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

        const resetButtonBehavior = resetBoxActor.setBehavior(ButtonBehavior);

        resetButtonBehavior.onHover('enter', (userId: string) => {
            resetBoxActor.startAnimation('expand');
        });

        resetButtonBehavior.onHover('exit', (userId: string) => {
            resetBoxActor.startAnimation('contract');
        });

        resetButtonBehavior.onClick('pressed', (userId: string) => {
            resetTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 };

            this.sphereActors.forEach(actor => actor.value.destroy());
            this.setupSphereActors();
        });

        resetButtonBehavior.onClick('released', (userId: string) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 };
        });

        return true;
    }

    private async setupSphereActors()
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

        await Promise.all(this.sphereActors);

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
            value: { transform: { rotation: Quaternion.RotationAxis(axis, Math.PI) } }
        }, {
            time: 1 * duration,
            value: { transform: { rotation: Quaternion.RotationAxis(axis, 2.0 * Math.PI) } }
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

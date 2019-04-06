import * as MRESDK from '@microsoft/mixed-reality-extension-sdk'
import * as MREEXT from '@microsoft/mixed-reality-extension-altspacevr-extras'

export default class Demo {
    private interval: NodeJS.Timeout
    
    private lastUser: MRESDK.User = null

    private beachBallMaterial: MRESDK.Material = null
    private greenMaterial: MRESDK.Material = null
    private redMaterial: MRESDK.Material = null

    private userHeadActor: MRESDK.Actor = null 
    private isCesiumManWalking: Boolean = false
    private cabinActor: MRESDK.Actor = null
    private skullActor: MRESDK.Actor = null
    private redSphereActor: MRESDK.Actor = null
    private sphereActorPromises: Array<MRESDK.ForwardPromise<MRESDK.Actor>> = []
    private videoPlayerManager: MREEXT.VideoPlayerManager
    private logActor: MRESDK.Actor = null

    constructor(private context: MRESDK.Context, private baseUrl: string) {
        this.context.onStarted(() => this.started())

        this.userJoined = this.userJoined.bind(this)
        this.context.onUserJoined(this.userJoined)

        this.videoPlayerManager = new MREEXT.VideoPlayerManager(context)
    }
    
    private async started() {
        try 
        {
            await this.loadMaterials()

            await this.setupScene()
            await this.setupCesiumMan()
            await this.setupSkull()
            await this.setupSpheres()
            await this.setupLight()
            await this.setupVisibility()
            await this.setupSound()
            await this.setupTeleporter()
            await this.setupVideoPlayer()
    
            if (this.lastUser != null) {
                await this.setupUserAttachments()
                this.skullActor.enableLookAt(this.userHeadActor, MRESDK.LookAtMode.TargetXY, true)
            }
        } 
        catch (e) 
        {
            console.log(e)
        }
    }

    private userJoined = async (user: MRESDK.User) => {
        this.lastUser = user

        if (this.skullActor != null) {
            await this.setupUserAttachments()
            this.skullActor.enableLookAt(this.userHeadActor, MRESDK.LookAtMode.TargetXY, true)
        }

        this.addToLog(user.name)
    }

    private addToLog(message: String) {
        console.log(message)

        if (this.logActor != null) { 
            this.logActor.text.contents = message + "\n" + this.logActor.text.contents
        }
    }

    private async loadMaterials()
    {
        const beachBallTexture = await this.context.assetManager.createTexture('beach-ball', {
            uri: `${this.baseUrl}/beach-ball.png`
        })

        this.beachBallMaterial = await this.context.assetManager.createMaterial('beach-ball', {
            mainTextureId: beachBallTexture.id
        })

        this.greenMaterial = await this.context.assetManager.createMaterial('green', {
            color: MRESDK.Color3.FromInts(0, 120, 0)
        })

        this.redMaterial = await this.context.assetManager.createMaterial('red', {
            color: MRESDK.Color3.FromInts(255, 0, 0)
        })
    }

    private async setupUserAttachments() {
        this.userHeadActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                attachment: {
                    userId: this.lastUser.id,
                    attachPoint: 'head'
                }
            }
        })
    }

    public async setupScene()
    {
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
        })

        // Ground
        MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Plane,
                dimensions: { x: 1000, y: 0, z: 1000 }
            },
            addCollider: true,
            actor: {
                appearance: { materialId: this.greenMaterial.id },
                transform: {
                    position: { x: 0, y: -1.6, z: 0 }
                }
            }
        })

        // Cabin
        this.cabinActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "artifact:993646440251130011",
            actor: {
                transform: {
                    position: { x: 20, y: -1.5, z: 0.0 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians),
                    scale: { x: 0.8, y: 0.8, z: 0.8}
                }
            }
        })

        // Red Sphere
        this.redSphereActor = await MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 0.3
            },
            addCollider: true,
            actor: {
                appearance: { materialId: this.redMaterial.id },
                transform: {
                    position: { x: -10.0, y: 2.0, z: -1.0 }
                }
            }
        })

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
        })
    }

    private async setupCesiumMan()
    {
        const cesiumManActor = await MRESDK.Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/CesiumMan.glb`,
            actor: {
                transform: {
                    position: { x: 0, y: -1.6, z: 7 },
                    scale: {x: 1.5, y: 1.5, z: 1.5}
                }
            }
        })

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
        })

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
        })

        await boxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        })

        await boxActor.createAnimation('contract', {
            keyframes: this.contractAnimationData,
            events: []
        })

        const buttonBehavior = boxActor.setBehavior(MRESDK.ButtonBehavior)

        buttonBehavior.onHover('enter', (userId: string) => {
            boxActor.enableAnimation('expand')
        })

        buttonBehavior.onHover('exit', (userId: string) => {
            boxActor.enableAnimation('contract')
        })

        buttonBehavior.onClick('pressed', (userId: string) => {
            textActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 }

            if (this.isCesiumManWalking == true)
            {
                this.isCesiumManWalking = false
                textActor.text.contents = "Start Walking"
                cesiumManActor.disableAnimation('animation:0')
            }
            else
            {
                this.isCesiumManWalking = true   
                textActor.text.contents = "Stop Walking"
                cesiumManActor.enableAnimation('animation:0')
            } 
        })

        buttonBehavior.onClick('released', (userId: string) => {
            textActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 }
        })
    }

    private async setupSkull()
    {
        const skullParentActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: this.cabinActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        })

        await skullParentActor.createAnimation('spin', {
            wrapMode: MRESDK.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(10, MRESDK.Vector3.Up()),
            events: []
        })
        
        skullParentActor.enableAnimation("spin")
    
        this.skullActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "artifact:1050090527044666141",
            actor: {
                parentId: skullParentActor.id,
                transform: {
                    position: { x: 0, y: 6, z: 9 },
                    scale: { x: 3, y: 3, z: 3}
                }
            }
        })
    }

    public async setupSpheres() {
        this.setupSphereActors()

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
        })

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
        })

        await dropBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        })

        await dropBoxActor.createAnimation('contract', {
            keyframes: this.contractAnimationData,
            events: []
        }) 

        const dropButtonBehavior = dropBoxActor.setBehavior(MRESDK.ButtonBehavior)

        dropButtonBehavior.onHover('enter', (userId: string) => {
            dropBoxActor.enableAnimation('expand')
        })

        dropButtonBehavior.onHover('exit', (userId: string) => {
            dropBoxActor.enableAnimation('contract')
        })

        dropButtonBehavior.onClick('pressed', (userId: string) => {
            dropTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 }

            this.sphereActorPromises.forEach(promise => promise.value.rigidBody.useGravity = true)
        })

        dropButtonBehavior.onClick('released', (userId: string) => {
            dropTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 }
        })

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
        })

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
        })

        await resetBoxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        })

        await resetBoxActor.createAnimation('contract', {
            keyframes: this.contractAnimationData,
            events: []
        })

        const resetButtonBehavior = resetBoxActor.setBehavior(MRESDK.ButtonBehavior)

        resetButtonBehavior.onHover('enter', (userId: string) => {
            resetBoxActor.enableAnimation('expand')
        })

        resetButtonBehavior.onHover('exit', (userId: string) => {
            resetBoxActor.enableAnimation('contract')
        })

        resetButtonBehavior.onClick('pressed', (userId: string) => {
            resetTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 }

            this.sphereActorPromises.forEach(promise => promise.value.destroy())

            this.setupSphereActors()
        })

        resetButtonBehavior.onClick('released', (userId: string) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 }
        })
    }

    public async setupLight() {
        const helmetActor = await MRESDK.Actor.CreateFromGltf(this.context, {
            resourceUrl: `${this.baseUrl}/DamagedHelmet.glb`,
            actor: {
                transform: {
                    position: { x: -10, y: 0.5, z: -10 }
                }
            }
        })

        const lightParentActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: helmetActor.id,
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        })

        await lightParentActor.createAnimation('spin', {
            wrapMode: MRESDK.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, MRESDK.Vector3.Up()),
            events: []
        })

        lightParentActor.enableAnimation("spin")
    
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
        })
    }

    public async setupVisibility () {
        this.interval = setInterval(() => {
            this.redSphereActor.appearance.enabled = !this.redSphereActor.appearance.enabled
        }, 2000)
    }

    private async setupSound() {
        const boxActor = await MRESDK.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: 1.2, y: 0.25, z: 0.01 }
            },
            addCollider: true,
            actor: {
                transform: {
                    position: { x: -5.0, y: 0.3, z: -2.0 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians)
                }
            }
        })

        await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: boxActor.id,
                transform: {
                    position: { x: 0, y: 0, z: -0.01 }
                },
                text: {
                    contents: "Play Notes",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        })

        await boxActor.createAnimation('expand', {
            keyframes: this.expandAnimationData,
            events: []
        })

        await boxActor.createAnimation('contract', {
            keyframes: this.contractAnimationData,
            events: []
        })

        let notes: number[] = [1, 3, 5, 6, 8, 10, 12, 13, 12, 10, 8, 6, 5, 3, 1]

        const notesAsset = await this.context.assetManager.createSound(
            'note',
            { uri: `${this.baseUrl}/GTR_note_C3.wav` }
        )

        const notesButtonBehavior = boxActor.setBehavior(MRESDK.ButtonBehavior)
        
        const playNotes = async () => {
            for (const note of notes) {
                boxActor.startSound(notesAsset.id,
                    {
                        doppler: 0.0,
                        pitch: note
                    })

                await this.delay(500)
            }
        }
        notesButtonBehavior.onClick('released', playNotes)
    }

    private async setupTeleporter() {
        const teleporterActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "teleporter:1133592462367917034",
            actor: {
                transform: {
                    position: { x: 7, y: -1.6, z: 7 }
                }
            }
        })

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
        })
    }

    private async setupVideoPlayer() 
    {
        const videoPlayer = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 0.5, z: -6 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 180 * MRESDK.DegreesToRadians),
                    scale: { x: 2, y: 2, z: 2 }
                },
            }
        })

        this.videoPlayerManager.play(
            videoPlayer.id,
            'http://www.youtube.com/watch?v=L_LUpnjgPso&t=33s',
            0.0)
    }

    private async setupSphereActors()
    {
        this.sphereActorPromises = []

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
                            appearance: { materialId: this.beachBallMaterial.id },
                            transform: {
                                position: {
                                    x: x + Math.random() / 2.0, 
                                    y: y, 
                                    z: z + Math.random() / 2.0}
                            }
                        }
                    })

                    this.sphereActorPromises.push(sphereActorPromise)
                }
            }
        }

        this.sphereActorPromises.forEach(promise => promise.value.enableRigidBody( { useGravity: false } ))
    }

    private generateSpinKeyframes(duration: number, axis: MRESDK.Vector3): MRESDK.AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { rotation: MRESDK.Quaternion.RotationAxis(axis, 0) } }
        }, {
            time: 0.5 * duration,
            value: { transform: { rotation: MRESDK.Quaternion.RotationAxis(axis, 180 * MRESDK.DegreesToRadians) } }
        }, {
            time: 1 * duration,
            value: { transform: { rotation: MRESDK.Quaternion.RotationAxis(axis, 360 * MRESDK.DegreesToRadians) } }
        }]
    }

    private expandAnimationData: MRESDK.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 1, y: 1, z: 1 } } }
    }, {
        time: 0.2,
        value: { transform: { scale: { x: 1.1, y: 1.1, z: 1.1 } } }
    }]

    private contractAnimationData: MRESDK.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 1.1, y: 1.1, z: 1.1 } } }
    }, {
        time: 0.2,
        value: { transform: { scale: { x: 1, y: 1, z: 1 } } }
    }]

    private delay(milliseconds: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => resolve(), milliseconds)
        })
    }
}

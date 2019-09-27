import * as MRESDK from '@microsoft/mixed-reality-extension-sdk'
import * as MREEXT from '@microsoft/mixed-reality-extension-altspacevr-extras'

export default class Demo {
    private assetContainer: MRESDK.AssetContainer

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
    private sphereActors: Array<MRESDK.Actor> = []
    private videoPlayerManager: MREEXT.VideoPlayerManager
    private logActor: MRESDK.Actor = null

    constructor(private context: MRESDK.Context, private baseUrl: string) {
        this.assetContainer = new MRESDK.AssetContainer(this.context)
        this.videoPlayerManager = new MREEXT.VideoPlayerManager(context)

        this.context.onStarted(() => this.started())
        this.context.onUserJoined((user) => this.userJoined(user))
    }
    
    private async started() {
        await this.loadMaterials()

        await this.setupScene()
        await this.setupCesiumMan()
        await this.setupSkull()
        await this.setupSpheres()
        await this.setupGrabbable()
        await this.setupLight()
        await this.setupVisibility()
        await this.setupSound()
        await this.setupTeleporter()
        await this.setupVideoPlayer()

        await this.setupSkullLookAt()

        if (this.lastUser != null) {
            this.addToLog(this.lastUser.name)
        }
    }

    private userJoined = async (user: MRESDK.User) => {
        this.lastUser = user

        await this.setupSkullLookAt()

        this.addDuckToUser(user)

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
        const beachBallTexture = await this.assetContainer.createTexture('beach-ball', {
            uri: `${this.baseUrl}/beach-ball.png`
        })

        this.beachBallMaterial = await this.assetContainer.createMaterial('beach-ball', {
            mainTextureId: beachBallTexture.id
        })

        this.greenMaterial = await this.assetContainer.createMaterial('green', {
            color: MRESDK.Color3.FromInts(0, 120, 0)
        })

        this.redMaterial = await this.assetContainer.createMaterial('red', {
            color: MRESDK.Color3.FromInts(255, 0, 0)
        })
    }

    private async addDuckToUser(user: MRESDK.User) {
        await MRESDK.Actor.CreateFromGltf(this.assetContainer, {
            uri: `${this.baseUrl}/Duck.glb`,
            actor: {
                transform: {
                    local: {
                        position: { x: 0.0, y: 0.05, z: 0.0 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 90 * MRESDK.DegreesToRadians),
                        scale: { x: 0.05, y: 0.05, z: 0.05 }
                    }
                },
                attachment: {
                    userId: user.id,
                    attachPoint: 'right-hand'
                }
            }
        })
    }

    private async setupSkullLookAt() {
        if (this.skullActor && this.lastUser) {
            this.userHeadActor = await MRESDK.Actor.CreateEmpty(this.context, {
                actor: {
                    attachment: {
                        userId: this.lastUser.id,
                        attachPoint: 'head'
                    }
                }
            })    

            this.skullActor.enableLookAt(this.userHeadActor, MRESDK.LookAtMode.TargetXY, true)
        }
    }

    public async setupScene()
    {
        // Title
        MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    local: {
                        position: { x: 0, y: 5, z: 8 }
                    }
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
        MRESDK.Actor.Create(this.context, {
            actor: {
                appearance: { 
                    meshId: this.assetContainer.createPlaneMesh('plane', 1000, 1000, 1, 1).id,
                    materialId: this.greenMaterial.id
                },
                collider: { geometry: { shape: 'auto' } },
                transform: { 
                    local: {
                        position: { x: 0, y: -1.3, z: 0 }
                    }
                }
            }
        })

        // Cabin
        this.cabinActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "artifact:993646440251130011",
            actor: {
                transform: {
                    local: {
                        position: { x: 20, y: -1.2, z: 0.0 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians),
                        scale: { x: 0.8, y: 0.8, z: 0.8}
                    }
                }
            }
        })

        // Red Sphere
        this.redSphereActor = await MRESDK.Actor.Create(this.context, {
            actor: {
                appearance: {
                    meshId: this.assetContainer.createSphereMesh('sphere', 0.3, 15, 15).id,
                    materialId: this.redMaterial.id 
                },
                collider: { geometry: { shape: 'auto' } },
                transform: {
                    local: {
                        position: { x: 11.0, y: 0.0, z: -21.0 }
                    }
                }
            }
        })

        // Log
        this.logActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    local: {
                        position: { x: -5, y: 0.0, z: -4 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians)
                    }
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
        const cesiumManActor = await MRESDK.Actor.CreateFromGltf(this.assetContainer, {
            uri: `${this.baseUrl}/CesiumMan.glb`,
            actor: {
                transform: {
                    local: {
                        position: { x: 0, y: -1.3, z: 7 },
                        scale: {x: 1.5, y: 1.5, z: 1.5}
                    }
                }
            }
        })

        const boxActor = await MRESDK.Actor.Create(this.context, {
            actor: {
                appearance: {
                    meshId: this.assetContainer.createBoxMesh(`cesiumManBox`, 1.5, 0.25, 0.01).id
                },
                collider: { geometry: { shape: 'auto' } },
                transform: {
                    local: {
                        position: { x: 0.0, y: 1.5, z: 7 }
                    }
                }
            }
        })

        const textActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: boxActor.id,
                transform: {
                    local: {
                        position: { x: 0, y: 0, z: -0.01 }
                    }
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

        buttonBehavior.onHover('enter', (user: MRESDK.User) => {
            boxActor.enableAnimation('expand')
        })

        buttonBehavior.onHover('exit', (user: MRESDK.User) => {
            boxActor.enableAnimation('contract')
        })

        buttonBehavior.onButton('pressed', (user: MRESDK.User) => {
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

        buttonBehavior.onButton ('released', (user: MRESDK.User) => {
            textActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 }
        })
    }

    private async setupSkull()
    {
        const skullParentActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: this.cabinActor.id,
                transform: {
                    local: {
                        position: { x: 0, y: 0, z: 0 }
                    }
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
                    local: {
                        position: { x: 0, y: 6, z: 10 },
                        scale: { x: 3, y: 3, z: 3}
                    }
                }
            }
        })
    }

    public async setupSpheres() {
        this.setupSphereActors()

        // Drop Button
        const dropBoxActor = await MRESDK.Actor.Create(this.context, {
            actor: {
                appearance: {
                    meshId: this.assetContainer.createBoxMesh(`dropBox`, 0.6, 0.25, 0.01).id
                },
                collider: { geometry: { shape: 'auto' } },
                transform: {
                    local: {
                        position: { x: -5, y: 0, z: -0.5 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians)
                    }
                }
            }
        })

        const dropTextActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: dropBoxActor.id,
                transform: {
                    local: {
                        position: { x: 0, y: 0, z: -0.01 }
                    }
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

        dropButtonBehavior.onHover('enter', (user: MRESDK.User) => {
            dropBoxActor.enableAnimation('expand')
        })

        dropButtonBehavior.onHover('exit', (user: MRESDK.User) => {
            dropBoxActor.enableAnimation('contract')
        })

        dropButtonBehavior.onButton('pressed', (user: MRESDK.User) => {
            dropTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 }

            this.sphereActors.forEach(actor => actor.rigidBody.useGravity = true)
        })

        dropButtonBehavior.onButton('released', (user: MRESDK.User) => {
            dropTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 }
        })

        // Reset Button
        const resetBoxActor = await MRESDK.Actor.Create(this.context, {
            actor: {
                appearance: {
                    meshId: this.assetContainer.createBoxMesh(`resetBox`, 0.7, 0.25, 0.01).id
                },
                collider: { geometry: { shape: 'auto' } },
                transform: {
                    local: {
                        position: { x: -5, y: 0, z: 0.5 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians)
                    }
                }
            }
        })

        const resetTextActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: resetBoxActor.id,
                transform: {
                    local: {
                        position: { x: 0, y: 0, z: -0.01 }
                    }
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

        resetButtonBehavior.onHover('enter', (user: MRESDK.User) => {
            resetBoxActor.enableAnimation('expand')
        })

        resetButtonBehavior.onHover('exit', (user: MRESDK.User) => {
            resetBoxActor.enableAnimation('contract')
        })

        resetButtonBehavior.onButton('pressed', (user: MRESDK.User) => {
            resetTextActor.text.color = { r: 255 / 255, g: 0 / 255, b: 0 / 255 }

            this.sphereActors.forEach(actor => actor.destroy())

            this.setupSphereActors()
        })

        resetButtonBehavior.onButton('released', (user: MRESDK.User) => {
            resetTextActor.text.color = { r: 0 / 255, g: 0 / 255, b: 255 / 255 }
        })
    }

    public async setupGrabbable() {
        const monkeyActor = await MRESDK.Actor.CreateFromGltf(this.assetContainer, {
            uri: `${this.baseUrl}/monkey.glb`,
            colliderType: 'box',
            actor: {
                transform: {
                    local: {
                        position: { x: 11, y: 0, z: -24 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians),
                        scale: { x: 0.2, y: 0.2, z: 0.2 }
                    }
                }
            }
        })
        monkeyActor.grabbable = true

        await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    local: {
                        position: { x: 11, y: 0.9, z: -24 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 90 * MRESDK.DegreesToRadians)
                    }
                },
                text: {
                    contents: "Grab the Monkey",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 0 / 255, g: 0 / 255, b: 255 / 255 },
                    height: 0.2
                }
            }
        })
    }

    public async setupLight() {
        const helmetActor = await MRESDK.Actor.CreateFromGltf(this.assetContainer, {
            uri: `${this.baseUrl}/DamagedHelmet.glb`,
            actor: {
                transform: {
                    local: {
                        position: { x: -9, y: 0.8, z: -14 }
                    }
                }
            }
        })

        const lightParentActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: helmetActor.id,
                transform: {
                    local: {
                        position: { x: 0, y: 0, z: 0 }
                    }
                }
            }
        })

        await lightParentActor.createAnimation('spin', {
            wrapMode: MRESDK.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, MRESDK.Vector3.Up()),
            events: []
        })

        lightParentActor.enableAnimation("spin")
    
        await MRESDK.Actor.Create(this.context, {
            actor: {
                parentId: lightParentActor.id,
                appearance: {
                    meshId: this.assetContainer.createSphereMesh('sphere', 0.2, 15, 15).id
                },
                collider: { geometry: { shape: 'auto' } },
                transform: {
                    local: {
                        position: { x: 3, y: 0, z: 0 }
                    }
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
        const boxActor = await MRESDK.Actor.Create(this.context, {
            actor: {
                appearance: {
                    meshId: this.assetContainer.createBoxMesh(`soundBox`, 1.2, 0.25, 0.01).id
                },
                collider: { geometry: { shape: 'auto' } },
                transform: {
                    local: {
                        position: { x: -5.0, y: 0.0, z: -8.0 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -90 * MRESDK.DegreesToRadians)
                    }
                }
            }
        })

        await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: boxActor.id,
                transform: {
                    local: {
                        position: { x: 0, y: 0, z: -0.01 }
                    }
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

        const notesAsset = await this.assetContainer.createSound(
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
        notesButtonBehavior.onButton('released', playNotes)
    }

    private async setupTeleporter() {
        const teleporterActor = await MRESDK.Actor.CreateFromLibrary(this.context, {
            resourceId: "teleporter:1148791394312127008",
            actor: {
                transform: {
                    local: {
                        position: { x: 11, y: -1.3, z: -13 }
                    }
                }
            }
        })

        await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: teleporterActor.id,
                transform: {
                    local: {
                        position: { x: 0, y: 2, z: 0 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 90 * MRESDK.DegreesToRadians)
                    }
                },
                text: {
                    contents: "Campfire",
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
                    local: {
                        position: { x: 11, y: 0.0, z: -17 },
                        rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 90 * MRESDK.DegreesToRadians),
                        scale: { x: 2, y: 2, z: 2 }
                    }
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
        this.sphereActors = []
            
        for (let y = 1; y <= 8; y = y + 1) {
            const sphereActor = await MRESDK.Actor.Create(this.context, {
                actor: {
                    appearance: {
                        meshId: this.assetContainer.createSphereMesh('sphere', 0.4, 15, 15).id,
                        materialId: this.beachBallMaterial.id
                    },
                    collider: { geometry: { shape: 'auto' } },
                    transform: {
                        local: {
                            position: {
                                x: -8 + Math.random() / 2.0, 
                                y: y, 
                                z: 0 + Math.random() / 2.0}
                        }
                    }
                }
            })

            this.sphereActors.push(sphereActor)
        }

        this.sphereActors.forEach(actor => actor.enableRigidBody( { useGravity: false } ))
    }

    private generateSpinKeyframes(duration: number, axis: MRESDK.Vector3): MRESDK.AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { local: { rotation: MRESDK.Quaternion.RotationAxis(axis, 0) } } }
        }, {
            time: 0.5 * duration,
            value: { transform: { local: { rotation: MRESDK.Quaternion.RotationAxis(axis, 180 * MRESDK.DegreesToRadians) } } }
        }, {
            time: 1 * duration,
            value: { transform: { local: { rotation: MRESDK.Quaternion.RotationAxis(axis, 360 * MRESDK.DegreesToRadians) } } }
        }]
    }

    private expandAnimationData: MRESDK.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { local: { scale: { x: 1, y: 1, z: 1 } } } }
    }, {
        time: 0.2,
        value: { transform: { local: { scale: { x: 1.1, y: 1.1, z: 1.1 } } } }
    }]

    private contractAnimationData: MRESDK.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { local: { scale: { x: 1.1, y: 1.1, z: 1.1 } } } }
    }, {
        time: 0.2,
        value: { transform: { local: { scale: { x: 1, y: 1, z: 1 } } } }
    }]

    private delay(milliseconds: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => resolve(), milliseconds)
        })
    }
}

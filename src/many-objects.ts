import * as MRESDK from '@microsoft/mixed-reality-extension-sdk'

export default class Demo {
    private beachBallMaterial: MRESDK.Material = null

    constructor(private context: MRESDK.Context, private baseUrl: string) {
        this.context.onStarted(() => this.started())
    }
    
    private started() {
        this.loadMaterials()
        this.setupSphereActors()
    }

    private loadMaterials()
    {
        const beachBallTexture = this.context.assetManager.createTexture('beach-ball', {
            uri: `${this.baseUrl}/beach-ball.png`
        })

        this.beachBallMaterial = this.context.assetManager.createMaterial('beach-ball', {
            mainTextureId: beachBallTexture.value.id
        }).value
    }

    private setupSphereActors()
    {
        for (let x = -2; x <= 2; x = x + 2) {
            for (let y = 0; y <= 10; y = y + 1) {
                for (let z = -2; z <= 2; z = z + 2) {
                    MRESDK.Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: MRESDK.PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            appearance: { materialId: this.beachBallMaterial.id },
                            transform: {
                                local: {
                                    position: {
                                        x: x + Math.random() / 2.0, 
                                        y: y, 
                                        z: z + Math.random() / 2.0}
                                }
                            }
                        }
                    })
                }
            }
        }
    }
}

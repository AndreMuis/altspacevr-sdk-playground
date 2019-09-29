import * as MRESDK from '@microsoft/mixed-reality-extension-sdk'

export default class ManyObjects {
    private assetContainer: MRESDK.AssetContainer = null
    private beachBallMaterial: MRESDK.Material = null

    constructor(private context: MRESDK.Context, private baseUrl: string) {
        this.assetContainer = new MRESDK.AssetContainer(this.context)

        this.context.onStarted(() => this.started())
    }
    
    private async started() {
        await this.loadMaterials()
        this.setupSphereActors()
    }

    private async loadMaterials()
    {
        const beachBallTexture = await this.assetContainer.createTexture('beach-ball', {
            uri: `${this.baseUrl}/beach-ball.png`
        })

        this.beachBallMaterial = await this.assetContainer.createMaterial('beach-ball', {
            mainTextureId: beachBallTexture.id
        })
    }

    private async setupSphereActors()
    {
        for (let x = -12; x <= 12; x = x + 1) {
            //for (let y = 0; y <= 2; y = y + 1) {
                //for (let z = -2; z <= 2; z = z + 2) {
                    MRESDK.Actor.Create(this.context, {
                        actor: {
                            appearance: {
                                meshId: this.assetContainer.createSphereMesh('sphere', 0.4, 10, 10).id,
                                materialId: this.beachBallMaterial.id
                            },
                            collider: { geometry: { shape: 'auto' } },
                            transform: {
                                local: {
                                    position: {x: x, y: 1, z: 1}
                                }
                            }
                        }
                    })
                //}
            //}
        }
    }
}

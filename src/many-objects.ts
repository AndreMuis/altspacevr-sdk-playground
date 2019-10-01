import * as MRESDK from '@microsoft/mixed-reality-extension-sdk'

export default class ManyObjects {
    private assetContainer: MRESDK.AssetContainer = null

    constructor(private context: MRESDK.Context, private baseUrl: string) {
        this.assetContainer = new MRESDK.AssetContainer(this.context)

        this.context.onStarted(() => this.started())
    }
    
    private async started() {
        this.setupSphereActors()
    }

    private setupSphereActors()
    {
        for (let x = 1; x <= 200; x = x + 1) {
            MRESDK.Actor.Create(this.context, {
                actor: {
                    appearance: {
                        meshId: this.assetContainer.createSphereMesh('sphere', 0.4, 10, 10).id
                    },
                    collider: { geometry: { shape: 'auto' } },
                    transform: {
                        local: {
                            position: {x: x, y: 1, z: 0}
                        }
                    }
                }
            })
        }
    }
}

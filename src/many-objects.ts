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
            try {
                MRESDK.Actor.Create(this.context, {
                    actor: {
                        appearance: {
                            meshId: this.assetContainer.createSphereMesh('sphere', 0.4, 10, 10).id
                        },
                        transform: {
                            local: {
                                position: {x: x, y: 1, z: 0}
                            }
                        }
                    }
                })
            }
            catch (e) {
                console.log("caught error")
                console.log(e)
            }
        }
    }
}

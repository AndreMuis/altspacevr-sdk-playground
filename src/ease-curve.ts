import * as MRESDK from '@microsoft/mixed-reality-extension-sdk'

export default class EaseCurve {
    constructor(private context: MRESDK.Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        const sphereParentActor = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                transform: {
                    local: {
                        position: { x: 0, y: 0, z: 5 }
                    }
                }
            }
        });

        await sphereParentActor.createAnimation('spin', {
            wrapMode: MRESDK.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, MRESDK.Vector3.Forward()),
            events: []
        });

        sphereParentActor.enableAnimation("spin");
    
        const assetContainer = new MRESDK.AssetContainer(this.context)
        await MRESDK.Actor.Create(this.context, {
            actor: {
                parentId: sphereParentActor.id,
                appearance: {
                    meshId: assetContainer.createSphereMesh('sphere', 0.5, 10, 10).id
                },
                collider: { geometry: { shape: 'auto' } },
                transform: {
                    local: {
                        position: { x: 0, y: 3, z: 0 }
                    }
                }
            }
        });
    }

    private generateSpinKeyframes(duration: number, axis: MRESDK.Vector3): MRESDK.AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { local: { rotation: MRESDK.Quaternion.RotationAxis(axis, 0) } } }
        }, {
            time: 0.5 * duration,
            value: { transform: { local: { rotation: MRESDK.Quaternion.RotationAxis(axis, -180 * MRESDK.DegreesToRadians) } } }
        }, {
            time: 1 * duration,
            value: { transform: { local: { rotation: MRESDK.Quaternion.RotationAxis(axis, -360 * MRESDK.DegreesToRadians) } } }
        }];
    }
}

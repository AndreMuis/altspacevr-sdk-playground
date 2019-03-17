import {
    Actor,
    AnimationKeyframe,
    AnimationWrapMode,
    Context,
    DegreesToRadians,
    PrimitiveShape,  
    Quaternion,
    Vector3
} from '@microsoft/mixed-reality-extension-sdk';

export default class EaseCurve {
    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        const sphereParentActor = await Actor.CreateEmpty(this.context, {
            actor: {
                name: 'sphere parent',
                transform: {
                    position: { x: 0, y: 0, z: 5 }
                }
            }
        });

        await sphereParentActor.createAnimation('spin', {
            wrapMode: AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, Vector3.Forward()),
            events: []
        });

        sphereParentActor.enableAnimation("spin");
    
        await Actor.CreatePrimitive(this.context, {
            definition: {
                shape: PrimitiveShape.Sphere,
                radius: 0.5,
                uSegments: 10,
                vSegments: 10

            },
            actor: {
                name: 'sphere',
                parentId: sphereParentActor.id,
                transform: {
                    position: { x: 0, y: 3, z: 0 }
                }
            }
        });
    }

    private generateSpinKeyframes(duration: number, axis: Vector3): AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { rotation: Quaternion.RotationAxis(axis, 0) } }
        }, {
            time: 0.5 * duration,
            value: { transform: { rotation: Quaternion.RotationAxis(axis, -180 * DegreesToRadians) } }
        }, {
            time: 1 * duration,
            value: { transform: { rotation: Quaternion.RotationAxis(axis, -360 * DegreesToRadians) } }
        }];
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
class EaseCurve {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.context.onStarted(() => this.started());
    }
    async started() {
        const sphereParentActor = await mixed_reality_extension_sdk_1.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'sphere parent',
                transform: {
                    position: { x: 0, y: 0, z: 5 }
                }
            }
        });
        await sphereParentActor.createAnimation('spin', {
            wrapMode: mixed_reality_extension_sdk_1.AnimationWrapMode.Loop,
            keyframes: this.generateSpinKeyframes(5, mixed_reality_extension_sdk_1.Vector3.Forward()),
            events: []
        }).catch(reason => console.log(`Failed to create spin animation: ${reason}`));
        sphereParentActor.enableAnimation("spin");
        await mixed_reality_extension_sdk_1.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: mixed_reality_extension_sdk_1.PrimitiveShape.Sphere,
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
    generateSpinKeyframes(duration, axis) {
        return [{
                time: 0 * duration,
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, 0) } }
            }, {
                time: 0.5 * duration,
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, -180 * mixed_reality_extension_sdk_1.DegreesToRadians) } }
            }, {
                time: 1 * duration,
                value: { transform: { rotation: mixed_reality_extension_sdk_1.Quaternion.RotationAxis(axis, -360 * mixed_reality_extension_sdk_1.DegreesToRadians) } }
            }];
    }
}
exports.default = EaseCurve;
//# sourceMappingURL=ease-curve.js.map
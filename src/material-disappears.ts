import {
    Actor,
    AssetGroup,
    ButtonBehavior,
    Context,
    ForwardPromise,
    PrimitiveShape,
    TextAnchorLocation
    
} from '@microsoft/mixed-reality-extension-sdk';

import * as GltfGen from '@microsoft/gltf-gen';

import Server from './server'

export default class MaterialDisappears {
    private assetGroup: AssetGroup = null;

    private sphereActorPromises: Array<ForwardPromise<Actor>> = [];

    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        await this.loadMaterials();

        await this.setupSpheres();
    }

    private async loadMaterials()
    {
        const beachBallMaterial = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/beach-ball.png`
                })
            })
        });

        const gltfFactory = new GltfGen.GltfFactory(null, null, [beachBallMaterial]);

        const buffer = Server.registerStaticBuffer('gltf-buffer', gltfFactory.generateGLTF());
    
        this.assetGroup = await this.context.assetManager.loadGltf('gltf-buffer', buffer);
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
                transform: {
                    position: { x: 0, y: 0, z: 7 }
                }
            }
        });

        await Actor.CreateEmpty(this.context, {
            actor: {
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

        const dropButtonBehavior = dropBoxActor.setBehavior(ButtonBehavior);

        dropButtonBehavior.onClick('pressed', (userId: string) => {
            this.sphereActorPromises.forEach(promise => promise.value.rigidBody.useGravity = true);
        });
    }

    private async setupSphereActors()
    {
        this.sphereActorPromises = [];

        for (let x = -2; x <= 2; x = x + 2) {
            for (let y = 2; y <= 12; y = y + 1) {
                for (let z = 8; z <= 12; z = z + 2) {
                    const sphereActorPromise = Actor.CreatePrimitive(this.context, {
                        definition: {
                            shape: PrimitiveShape.Sphere,
                            radius: 0.4
                        },
                        addCollider: true,
                        actor: {
                            materialId: this.assetGroup.materials.byIndex(0).id,
                            transform: {
                                position: {
                                    x: x + Math.random() / 2.0, 
                                    y: y, 
                                    z: z + Math.random() / 2.0}
                            }
                        }
                    });

                    this.sphereActorPromises.push(sphereActorPromise);
                }
            }
        }

        this.sphereActorPromises.forEach(promise => promise.value.enableRigidBody( { useGravity: false } ));
    }
}

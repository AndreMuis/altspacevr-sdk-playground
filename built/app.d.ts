import { Context } from '@microsoft/mixed-reality-extension-sdk';
export default class Demo {
    private context;
    private baseUrl;
    private isCesiumManWalking;
    private skullActor;
    private sphereActors;
    private frogActor;
    private logActor;
    constructor(context: Context, baseUrl: string);
    private started;
    private userJoined;
    private moveFrog;
    private addToLog;
    setupScene(): void;
    private setupCesiumMan;
    private setupSkull;
    setupSpheres(): void;
    private setupGlTF;
    private setupSphereActors;
    private generateSpinKeyframes;
    private expandAnimationData;
    private contractAnimationData;
}
//# sourceMappingURL=app.d.ts.map
import { Context } from '@microsoft/mixed-reality-extension-sdk';
export default class Demo {
    private context;
    private baseUrl;
    private baseURLTranslated;
    private isCesiumManWalking;
    private skullActor;
    private sphereActors;
    private frogActor;
    private videoPlayerManager;
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
    private setupTeleporter;
    private setupVideoPlayer;
    private setupSphereActors;
    private generateSpinKeyframes;
    private expandAnimationData;
    private contractAnimationData;
}
//# sourceMappingURL=app.d.ts.map
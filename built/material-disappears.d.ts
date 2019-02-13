import { Context } from '@microsoft/mixed-reality-extension-sdk';
export default class MaterialDisappears {
    private context;
    private baseUrl;
    private assetGroup;
    private sphereActorPromises;
    constructor(context: Context, baseUrl: string);
    private started;
    private loadMaterials;
    setupSpheres(): Promise<void>;
    private setupSphereActors;
}
//# sourceMappingURL=material-disappears.d.ts.map
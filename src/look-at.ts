import {
    Actor,
    Context,
    LookAtMode,
    User
} from '@microsoft/mixed-reality-extension-sdk';

export default class LookAt {
    private lastUser: User = null;
    
    private frogActor: Actor = null;
    private skullActor: Actor = null;

    constructor(private context: Context, private baseUrl: string) {
        this.context.onStarted(() => this.started());

        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);
    }

    private userJoined = async (user: User) => {
        this.lastUser = user;
    }

    private async started() {
        await this.setupKitArtifacts();

        //this.frogActor.lookAt(this.lastUser, LookAtMode.TargetXY);
        //this.skullActor.lookAt(this.lastUser, LookAtMode.TargetXY);
    }

    private async setupKitArtifacts()
    {
        this.frogActor = await Actor.CreateFromLibrary(this.context, {
            resourceId: "986410508452102645",
            actor: {
                name: 'frog',
                transform: {
                    position: { x: -4, y: 0, z: 5 },
                    scale: { x: 8, y: 8, z: 8}
                }
            }
        });

        this.skullActor = await Actor.CreateFromLibrary(this.context, {
            resourceId: "1050090527044666141",
            actor: {
                name: 'skull',
                transform: {
                    position: { x: 4, y: 0, z: 5 },
                    scale: { x: 3, y: 3, z: 3}
                }
            }
        });
    }
}

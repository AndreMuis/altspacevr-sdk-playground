"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
class LookAt {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.lastUser = null;
        this.frogActor = null;
        this.skullActor = null;
        this.userJoined = async (user) => {
            this.lastUser = user;
        };
        this.context.onStarted(() => this.started());
        this.userJoined = this.userJoined.bind(this);
        this.context.onUserJoined(this.userJoined);
    }
    async started() {
        await this.setupKitArtifacts();
        //this.frogActor.lookAt(this.lastUser, LookAtMode.TargetXY);
        //this.skullActor.lookAt(this.lastUser, LookAtMode.TargetXY);
    }
    async setupKitArtifacts() {
        this.frogActor = await mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "986410508452102645",
            actor: {
                name: 'frog',
                transform: {
                    position: { x: -4, y: 0, z: 5 },
                    scale: { x: 8, y: 8, z: 8 }
                }
            }
        });
        this.skullActor = await mixed_reality_extension_sdk_1.Actor.CreateFromLibrary(this.context, {
            resourceId: "1050090527044666141",
            actor: {
                name: 'skull',
                transform: {
                    position: { x: 4, y: 0, z: 5 },
                    scale: { x: 3, y: 3, z: 3 }
                }
            }
        });
    }
}
exports.default = LookAt;
//# sourceMappingURL=look-at.js.map
'use strict';

let PlatformAccessory, Characteristic, Service, UUIDGen;

module.exports = (homebridge) => {

    PlatformAccessory = homebridge.platformAccessory;

    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-nexa-switch-platform", "NexaSwitchPlatform", NexaSwitchPlatform, true);

};

function NexaSwitchPlatform(log, config, api) {

    // Self reference variable for accessing self's properties regardless of where the 'this' -keyword points
    const platform = this;

    if (log) this.log = log;
    else throw new Error("Log parameter neglected when the NexaSwitchPlatform constructor was called!");

    if (config && config.controllerAddress) {
        this.config = config;
    } else if (config) {
        this.config = {"controllerAddress": "localhost:51827"};
        this.log.warn("Controller address could not be read from Homebridge configuration " +
            "–> defaults to 'localhost:51827'.");
    } else {
        this.config = {"controllerAddress": "localhost:51827"};
        this.log.warn("Could not read Homebridge configuration. " +
            "Controller address defaulted to 'localhost:51827'.");
    }

    if (api) this.api = api;
    else throw new Error("API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "A possible cause may be an outdated Homebridge installation.");

    // TODO: insert controller server startup here and fetch number of accessories

}

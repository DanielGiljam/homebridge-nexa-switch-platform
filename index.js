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

    if (log) this.log = log;
    else throw new Error(
        "Log parameter neglected when the NexaSwitchPlatform constructor was called!");

    this.log = "Launching...";

    if (config && config.controllerAddress) {
        this.config = config;
    } else if (config) {
        this.config = {"controllerAddress": "localhost:51827"};
        this.log.warn(
            "Controller address could not be read from Homebridge configuration " +
            "–> defaults to 'localhost:51827'.");
    } else {
        this.config = {"controllerAddress": "localhost:51827"};
        this.log.warn(
            "Could not read Homebridge configuration. " +
            "Controller address defaults to 'localhost:51827'.");
    }

    if (api) this.api = api;
    else throw new Error(
        "API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "Check the version of your Homebridge installation. It may be outdated.");

    // TODO: insert controller server startup here and fetch number of accessories

    this.api.on("didFinishLaunching", function() {
        this.log("Finished launching...");
    }.bind(this));

}

NexaSwitchPlatform.prototype.addAccessory = (accessoryInformation) => {

    if (!accessoryInformation || !accessoryInformation.name) {
        throw new Error(
            "Could not add accessory. Accessory name ('-.name') needs to be provided " +
            "within the 'accessoryInformation' parameter in the 'addAccessory' prototype function.");
    }

    const accessory = new PlatformAccessory(accessoryInformation.name, UUIDGen.generate(accessoryInformation.name));

    accessory.context.name = accessoryInformation.name;

    if (!accessoryInformation.manufacturer) this.log.warn(
        "Accessory manufacturer ('-.manufacturer') wasn't provided within " +
        "the 'accessoryInformation' parameter " +
        "in the 'addAccessory' prototype function.");
    if (!accessoryInformation.model) this.log.warn(
        "Accessory model ('-.model') wasn't provided within " +
        "the 'accessoryInformation' parameter " +
        "in the 'addAccessory' prototype function.");
    if (!accessoryInformation.serialNumber) this.log.warn(
        "Accessory serial number ('-.serialNumber') wasn't provided within " +
        "the 'accessoryInformation' parameter " +
        "in the 'addAccessory' prototype function.");
    else accessoryInformation.serialNumber = "000-000-000";

    accessory.context.manufacturer = accessoryInformation.manufacturer || "Unknown";
    accessory.context.model = accessoryInformation.model || "Unknown";

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessoryInformation.manufacturer)
        .setCharacteristic(Characteristic.Model, accessoryInformation.model)
        .setCharacteristic(Characteristic.SerialNumber, accessoryInformation.serialNumber);

    const switchService = accessory.addService(Service.Switch, "Power Switch");
    switchService.getCharacteristic(Characteristic.On)
        .on("get", () => {}) // TODO: write an actual function here
        .on("set", () => {}) // TODO: write an actual function here

};



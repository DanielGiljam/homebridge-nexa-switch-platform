"use strict";

const http = require("http");
let PlatformAccessory, Characteristic, Service, UUIDGen;

const controller = require("./controller");

module.exports = homebridge => {

    PlatformAccessory = homebridge.platformAccessory;

    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-nexa-switch-platform", "NexaSwitchPlatform", NexaSwitchPlatform, true);

};

function NexaSwitchPlatform(log, config, api) {

    if (!log) throw new Error("Log parameter neglected when the NexaSwitchPlatform constructor was called!");

    if (!config.controllerPort && config) {
        config.controllerPort = 51927;
        log.warn(
            "Controller address could not be read from Homebridge configuration " +
            "–> defaults to 'localhost:51827'.");
    } else {
        config = { controllerPort: 51927 };
        log.warn(
            "Could not read Homebridge configuration. " +
            "Controller address defaults to 'localhost:51827'.");
    }

    if (!api) throw new Error(
        "API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "Check the version of your Homebridge installation. It may be outdated.");

    controller(log, config.controllerPort);

    const reqOptions = {
        hostname: "localhost",
        port: config.controllerPort,
        path: "/config",
        method: "GET"
    };

    http.request(reqOptions, (res) => {

    });

    api.on("didFinishLaunching", function() {
        this.log("Finished launching...");
    }.bind(this));

}

NexaSwitchPlatform.prototype.addAccessory = accessoryInformation => {

    const accessory = new PlatformAccessory(accessoryInformation.name, UUIDGen.generate(accessoryInformation.name));

    accessory.context.name = accessoryInformation.name;
    accessory.context.manufacturer = accessoryInformation.manufacturer;
    accessory.context.model = accessoryInformation.model;

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessoryInformation.manufacturer)
        .setCharacteristic(Characteristic.Model, accessoryInformation.model)
        .setCharacteristic(Characteristic.SerialNumber, accessoryInformation.serialNumber);

    const switchService = accessory.addService(Service.Switch, "Power Switch");
    switchService.getCharacteristic(Characteristic.On)
        .on("get", this.getSwitchOnCharacteristic.bind(this))
        .on("set", this.setSwitchOnCharacteristic.bind(this))

};

NexaSwitchPlatform.prototype.getSwitchOnCharacteristic = (next) => {
    // TODO: write an actual function here
};

NexaSwitchPlatform.prototype.setSwitchOnCharacteristic = (on, next) => {
    // TODO: write an actual function here
};



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

    if (config.controllerHost && config.controllerPort && config) {

    } else if ((!config.controllerHost || !config.controllerPort) && config) {
        config.controllerHost = "localhost";
        config.controllerPort = 51927;
        log(
            "Controller address could not be read from Homebridge configuration " +
            "–> defaults to 'localhost:51827'.");
    } else {
        config = { controllerHost: 'localhost', controllerPort: 51927 };
        log(
            "Could not read Homebridge configuration. " +
            "Controller address defaults to 'localhost:51827'.");
    }

    if (!api) throw new Error(
        "API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "Check the version of your Homebridge installation. It may be outdated.");

    controller(log, config.controllerPort);

    this.accessories = [];

    const reqOptions = {
        hostname: "localhost",
        port: config.controllerPort,
        path: "/config",
        method: "GET"
    };

    const req = http.request(reqOptions, res => {
        log(`Requesting configuration from controller, ` +
            `response status code: ${res.statusCode} –> ${res.statusMessage}`);
        let data;
        res.on('data', chunk => {
            data += chunk.toString();
        });
        res.on('end', () => {
            data = JSON.parse(data);
            config.accessoryInformation = [];
            config.accessoryInformation.push(data);
            for(let i = 0; i < config.accessoryInformation.length; i++) {
                this.accessories.push(this.addAccessory(config.accessoryInformation[i]));
            }
            api.registerPlatformAccessories("homebridge-nexa-switch-platform", "NexaSwitchPlatform", this.accessories)
        });
    });

    req.end();

    api.on("didFinishLaunching", function() {
        log("Finished launching...");
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
        .on("set", this.setSwitchOnCharacteristic.bind(this));

    return accessory;
};

NexaSwitchPlatform.prototype.getSwitchOnCharacteristic = (next) => {
    // TODO: write an actual function here
};

NexaSwitchPlatform.prototype.setSwitchOnCharacteristic = (on, next) => {
    // TODO: write an actual function here
};

NexaSwitchPlatform.prototype.configureAccessory = accessory => {
    if (accessory.getService(Service.Switch)) {
        accessory.getService(Service.Switch)
            .getCharacteristic(Characteristic.On)
            .on("get", this.getSwitchOnCharacteristic.bind(this))
            .on("set", this.setSwitchOnCharacteristic.bind(this));
    }
    this.accessories.push(accessory);
};



"use strict";

const http = require("http");
let PlatformAccessory, Characteristic, Service, UUIDGen, Logger;

const controller = require("./controller");

module.exports = homebridge => {

    PlatformAccessory = homebridge.platformAccessory;

    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;

    UUIDGen = homebridge.hap.uuid;
    Logger = homebridge.Logger;

    homebridge.registerPlatform("homebridge-nexa-switch-platform", "NexaSwitchPlatform", NexaSwitchPlatform, true);

};

function NexaSwitchPlatform(log, config, api) {

    if (!log) throw new Error("Log parameter neglected when the NexaSwitchPlatform constructor was called!");
    else this.log = log;

    if (config && this.validateConfig(config)) {
        this.config = config;
    } else {
        this.config = { controllerPort: 51927, emitterId: '31415', accessoryInformation: [] };
        this.log(
            "Could not read Homebridge configuration. " +
            "Values default to controller port: '51827', emitter id: '31415' and 0 accessories.");
    }

    if (!api) throw new Error(
        "API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "Check the version of your Homebridge installation. It may be outdated.");

    controller(this.config.controllerPort);

    this.accessories = [];
    this.accessoriesToBeRegistered = [];
    this.accessoriesToBeUnregistered = [];

    api.on("didFinishLaunching", () => {
        this.config.accessoriesToBeUnregistered = this.accessories;
        for (let index in this.config.accessoryInformation) {
            this.addAccessory(this.config.accessoryInformation[index]);
        }
        if (this.accessoriesToBeRegistered.length !== 0) {
            api.registerPlatformAccessories(
                "homebridge-nexa-switch-platform",
                "NexaSwitchPlatform",
                this.accessoriesToBeRegistered);
        }
        if (this.accessoriesToBeUnregistered.length !== 0) {
            api.unregisterPlatformAccessories(
                "homebridge-nexa-switch-platform",
                "NexaSwitchPlatform",
                this.accessoriesToBeUnregistered);
        }
        this.log("Finished launching...");
    });

}

NexaSwitchPlatform.prototype.addAccessory = function(accessoryInformation) {

    const uuid = UUIDGen.generate(accessoryInformation.name);

    if (this.accessoryRegistered(uuid)) {
        this.log(`Accessory '${accessoryInformation.name} (${accessoryInformation.manufacturer} ${accessoryInformation.model})' already added...`);
        return;
    }

    this.log(`Adding accessory '${accessoryInformation.name} (${accessoryInformation.manufacturer} ${accessoryInformation.model})'...`);

    const accessory = new PlatformAccessory(accessoryInformation.name, uuid);

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

    this.accessoriesToBeRegistered.push(accessory);
};

NexaSwitchPlatform.prototype.configureAccessory = function(accessory) {
    this.log(`Restoring accessory '${accessory.context.name} (${accessory.context.manufacturer} ${accessory.context.model})'...`);
    this.accessories.push(accessory);
};

NexaSwitchPlatform.prototype.getSwitchOnCharacteristic = function(next) {
    // TODO: write an actual function here
};

NexaSwitchPlatform.prototype.setSwitchOnCharacteristic = function(on, next) {
    // TODO: write an actual function here
};

NexaSwitchPlatform.prototype.validateConfig = function(config) {
    return true; // TODO: actually make this function
};

NexaSwitchPlatform.prototype.accessoryRegistered = function(uuid) {
    for (let index in this.accessories) {
        if (this.accessories[index].UUID === uuid) {
            this.accessoriesToBeUnregistered.splice(index);
            return true;
        }
    }
    return false;
};
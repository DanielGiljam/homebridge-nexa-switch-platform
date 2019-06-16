"use strict";

const exec = require('child_process').exec;
let PlatformAccessory, Characteristic, Service, UUIDGen, Logger;

module.exports = homebridge => {

    PlatformAccessory = homebridge.platformAccessory;

    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;

    UUIDGen = homebridge.hap.uuid;
    Logger = homebridge.Logger;

    homebridge.registerPlatform("homebridge-nexa-switch-platform", "NexaSwitchPlatform", NexaSwitchPlatform, true);

};

function NexaSwitchPlatform(log, config, api) {

    if (log == null) throw new Error("Log parameter neglected when the NexaSwitchPlatform constructor was called!");
    else this.log = log;

    if (config != null && this.validateConfig(config)) {
        this.config = config;
    } else {
        this.config = { platform: 'NexaSwitchPlatform', name: 'Nexa Switch Platform', emitterId: '31415', accessoryInformation: [] };
        this.log(
            "Could not read Homebridge configuration. " +
            "Values default to platform: 'NexaSwitchPlatform', " +
            "name: 'Nexa Switch Platform', " +
            "emitter id: '31415' and 0 accessories.");
    }

    if (api == null) throw new Error(
        "API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "Check the version of your Homebridge installation. It may be outdated.");

    this.accessories = [];
    this.accessoriesToBeRegistered = [];
    this.accessoriesToBeUnregistered = [];

    api.on("didFinishLaunching", () => {
        this.accessoriesToBeUnregistered = this.accessories;
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
            this.log(`Removing ${this.accessoriesToBeUnregistered.length} deprecated accessories...`);
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
    accessory.context.accessoryId = accessoryInformation.accessoryId;

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessoryInformation.manufacturer)
        .setCharacteristic(Characteristic.Model, accessoryInformation.model)
        .setCharacteristic(Characteristic.SerialNumber, accessoryInformation.serialNumber);

    const switchService = accessory.addService(Service.Switch, accessoryInformation.name);
    switchService.getCharacteristic(Characteristic.On)
        .on("set", this.setSwitchOnCharacteristic.bind({ emitterId: this.config.emitterId,
                                                         accessoryIndex: accessoryInformation.accessoryId }));

    this.accessoriesToBeRegistered.push(accessory);
};

NexaSwitchPlatform.prototype.configureAccessory = function(accessory) {
    this.log(`Restoring accessory '${accessory.context.name} (${accessory.context.manufacturer} ${accessory.context.model})'...`);
    
    const switchService = accessory.getService(Service.Switch);
    switchService.getCharacteristic(Characteristic.On)
        .on("set", this.setSwitchOnCharacteristic.bind({ emitterId: this.config.emitterId,
                                                         accessoryIndex: accessory.context.accessoryId }));
    
    this.accessories.push(accessory);
};

NexaSwitchPlatform.prototype.setSwitchOnCharacteristic = function(on, next) {
    const state = on ? 'on' : 'off';
    exec(`sudo piHomeEasy 0 ${this.emitterId} ${this.accessoryIndex} ${state}`);
    return next();
};

NexaSwitchPlatform.prototype.validateConfig = function(config) {
    const platformSet = config.platform != null && typeof config.platform === 'string';
    const nameSet = config.name != null && typeof config.name === 'string';
    const emitterIdSet = config.emitterId != null && typeof config.emitterId === 'number' && config.emitterId >= 1 && config.emitterId <= 67108862;
    let accessoryInformationSet = config.accessoryInformation != null;
    if (accessoryInformationSet) {
        for (let index in config.accessoryInformation) {
            const accessoryInformation = config.accessoryInformation[index];
            const nameSet = accessoryInformation.name != null && typeof accessoryInformation.name === 'string';
            const manufacturerSet = accessoryInformation.manufacturer != null && typeof accessoryInformation.manufacturer === 'string';
            const modelSet = accessoryInformation.model != null && typeof accessoryInformation.model === 'string';
            const serialNumberSet = accessoryInformation.serialNumber != null && typeof accessoryInformation.serialNumber === 'string';
            accessoryInformationSet = nameSet && manufacturerSet && modelSet && serialNumberSet;
            if (!accessoryInformationSet) break;
        }
    }
    return platformSet && nameSet && emitterIdSet && accessoryInformationSet;
};

NexaSwitchPlatform.prototype.accessoryRegistered = function(uuid) {
    for (let index in this.accessoriesToBeUnregistered) {
        if (this.accessoriesToBeUnregistered[index].UUID === uuid) {
            this.accessoriesToBeUnregistered.splice(index, 1);
            return true;
        }
    }
    return false;
};

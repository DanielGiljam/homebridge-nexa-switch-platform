"use strict";

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const ConfigProcessor = require('./utility/config-processor');
const OperationSequencer = require('./utility/operation-sequencer');

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

    if (api == null) throw new Error(
        "API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "Check the version of your Homebridge installation. It may be outdated.");

    this.config = new ConfigProcessor(log, config).validateConfig();
    this.log = log;

    this.accessories = [];
    this.accessoriesToBeRegistered = [];
    this.accessoriesToBeUnregistered = [];

    this.operationSequencer = new OperationSequencer(async function (accessoryId, state) {
        const { stdout, stderr } = await exec(`sudo piHomeEasy ${this.transmitterPin} ${this.emitterId} ${accessoryId} ${state}`);
        return `Completed operation. accessoryId: '${accessoryId}', state: '${state}', stdout: '${stdout}', stderr: '${stderr}'.`;
    }, log);

    api.on("didFinishLaunching", () => {
        this.accessoriesToBeUnregistered = this.accessories;
        for (let index in this.config.accessories) {
            this.addAccessory(this.config.accessories[index]);
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

    let uuid = UUIDGen.generate(accessoryInformation.accessoryName);
    const cachedAccessory = this.accessoryRegistered(uuid, accessoryInformation);
    if (cachedAccessory) {
        const propertyTests = [
            accessoryInformation.accessoryName === cachedAccessory.context.accessoryName,
            accessoryInformation.accessoryId === cachedAccessory.context.accessoryId,
            accessoryInformation.manufacturer === cachedAccessory.context.manufacturer,
            accessoryInformation.model === cachedAccessory.context.model,
            accessoryInformation.serialNumber === cachedAccessory.context.serialNumber
        ];
        if (propertyTests === true) {
            this.log(`Accessory '${accessoryInformation.accessoryName} (${accessoryInformation.manufacturer} ${accessoryInformation.model})' already added...`);
            return;
        } else {
            this.log(`Accessory '${accessoryInformation.accessoryName} (${accessoryInformation.manufacturer} ${accessoryInformation.model})' has modified properties in config. Applying...`);
            this.accessoriesToBeUnregistered.push(cachedAccessory);
        }
    } else {
        this.log(`Adding accessory '${accessoryInformation.accessoryName} (${accessoryInformation.manufacturer} ${accessoryInformation.model})'...`);
    }

    const accessory = new PlatformAccessory(accessoryInformation.accessoryName, uuid);

    accessory.context.name = accessoryInformation.accessoryName;
    accessory.context.accessoryId = accessoryInformation.accessoryId;

    accessory.context.manufacturer = (accessoryInformation.manufacturer != null) ? accessoryInformation.manufacturer : 'N/A';
    accessory.context.model = (accessoryInformation.model != null) ? accessoryInformation.model : 'N/A';
    accessory.context.serialNumber = (accessoryInformation.serialNumber != null) ? accessoryInformation.serialNumber : 'N/A';

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessory.context.manufacturer)
        .setCharacteristic(Characteristic.Model, accessory.context.model)
        .setCharacteristic(Characteristic.SerialNumber, accessory.context.serialNumber);

    const switchService = accessory.addService(Service.Switch, accessoryInformation.accessoryName);
    switchService.getCharacteristic(Characteristic.On)
        .on("set", this.setSwitchOnCharacteristic.bind({
          accessoryId: accessoryInformation.accessoryId
        }));

    this.accessoriesToBeRegistered.push(accessory);
};

NexaSwitchPlatform.prototype.configureAccessory = function(accessory) {

    this.log(`Restoring accessory '${accessory.context.name} (${accessory.context.manufacturer} ${accessory.context.model})'...`);

    const switchService = accessory.getService(Service.Switch);
    switchService.getCharacteristic(Characteristic.On)
        .on("set", this.setSwitchOnCharacteristic.bind({
          accessoryId: accessory.context.accessoryId
        }));

    this.accessories.push(accessory);
};

NexaSwitchPlatform.prototype.setSwitchOnCharacteristic = function(on, next) {

    const state = on ? 'on' : 'off';
    this.operationSequencer.sendOp(this.accessoryId, state);
    return next();
};

NexaSwitchPlatform.prototype.accessoryRegistered = function(uuid) {

    for (let index in this.accessoriesToBeUnregistered) {
        if (this.accessoriesToBeUnregistered[index].UUID === uuid) {
            return this.accessoriesToBeUnregistered.splice(index, 1)[0];
        }
    }
    return false;
};

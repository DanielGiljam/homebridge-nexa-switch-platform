"use strict";

// const util = require('util');
// const exec = util.promisify(require('child_process').exec);
const spawn = require('child_process').spawn;

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

    this.operationSequencer = new OperationSequencer(/*async (accessoryId, state) => {
        const { stdout, stderr } = await exec(`sudo ./utility/piHomeEasyExtended.sh ${this.config.transmitterPin} ${this.config.emitterId} ${accessoryId} ${state}`);
        return `Completed operation. accessoryId: '${accessoryId}', state: '${state}', stdout: '${stdout.trim()}', stderr: '${stderr.trim()}'.`;
    }, */async (...queue) => {
        return await new Promise((resolve, reject) => {
            const process = spawn('./../homebridge-nexa-switch-platform/utility/piHomeEasyExtended.sh', [this.config.transmitterPin, this.config.emitterId, ...queue]);
            process.stdout.on('data', data => this.log(`[piHomeEasyExtended] ${data}`.trim()));
            process.stderr.on('data', data => this.log.error(`[piHomeEasyExtended] ${data}`.trim()));
            process.on('close', code => {
                this.log(`[piHomeEasyExtended] Script finished and closed with code ${code}.`);
                resolve(code.toString())
            });
            process.on('exit', code => {
                this.log(`[piHomeEasyExtended] Script exited with code ${code}.`);
                resolve(code.toString())
            });
            process.on('error', error => {
                reject(error)
            });
        }).catch(error => { throw error });
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
    if (this.accessoryRegistered(uuid)) {
        return;
    }

    this.log(`Adding accessory '${accessoryInformation.accessoryName}'...`);

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
            operationSequencer: this.operationSequencer,
            accessoryId: accessoryInformation.accessoryId
        }));

    this.accessoriesToBeRegistered.push(accessory);
};

NexaSwitchPlatform.prototype.configureAccessory = function(accessory) {

    this.log(`Restoring accessory '${accessory.context.name}'...`);

    const accessoryInformation = this.config.accessories.find(element => {
        return (element != null) ? element.accessoryName === accessory.context.name : false
    });

    if (accessoryInformation != null) {
        accessory.context.name = accessoryInformation.accessoryName;
        accessory.context.accessoryId = accessoryInformation.accessoryId;

        accessory.context.manufacturer = (accessoryInformation.manufacturer != null) ? accessoryInformation.manufacturer : 'N/A';
        accessory.context.model = (accessoryInformation.model != null) ? accessoryInformation.model : 'N/A';
        accessory.context.serialNumber = (accessoryInformation.serialNumber != null) ? accessoryInformation.serialNumber : 'N/A';
    }

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessory.context.manufacturer)
        .setCharacteristic(Characteristic.Model, accessory.context.model)
        .setCharacteristic(Characteristic.SerialNumber, accessory.context.serialNumber);

    const switchService = accessory.getService(Service.Switch);
    switchService.getCharacteristic(Characteristic.On)
        .on("set", this.setSwitchOnCharacteristic.bind({
            operationSequencer: this.operationSequencer,
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
            this.accessoriesToBeUnregistered.splice(index, 1);
            return true;
        }
    }
    return false;
};

"use strict";

const fs = require('fs');

class ConfigProcessor {
    constructor(log, config) {
        this.log = log;
        this.config = config;
    }
    validateConfig() {

        // Validating the platform's parameters...

        const invalidProperties = [];

        // transmitterPin: must be a number, min. 0, max. 16
        if (!ConfigProcessor.validateNumber(this.config.transmitterPin, 0, 16)) invalidProperties.push('transmitterPin');

        // emitterId: must be a number, min. 1, max. 67108862
        if (!ConfigProcessor.validateNumber(this.config.emitterId, 1, 67108862)) invalidProperties.push('emitterId');

        if (invalidProperties.length !== 0) {
            const fallbackConfig = JSON.parse(fs.readFileSync('./misc/fallback-config.json'));
            for (let propertyName of invalidProperties) {
                this.log(`Could not read property '${propertyName}'. Assigning default value: ${fallbackConfig[propertyName]}.`);
                this.config[propertyName] = fallbackConfig[propertyName];
            }
        }

        // If the config's list of accessories' length surpasses the HomeEasy protocol's accessory limit, then the validation returns false.
        if (this.config.accessories.length > 16) {
            this.log.error('Amount of accessories declared in the config exceeds the maximum amount of accessories allowed (16). Unable to add/restore any accessories.');
            this.config.accessories = [];
            return this.config;
        }

        // Spotting out invalid accessories...
        const invalidAccessories = [];
        for (let accessoryIndex in this.config.accessories) {

            const accessory = this.config.accessories[accessoryIndex];
            const invalidProperties = [];

            // accessoryName: must be a string
            if (!ConfigProcessor.validateProperty(accessory.accessoryName, 'string')) invalidProperties.push('accessory');

            // accessoryId: if provided, must be a number, min. 0, max. 15
            if (!ConfigProcessor.validateOptionalNumber(accessory.accessoryId, 0, 15)) invalidProperties.push('accessoryId');

            // manufacturer: if provided, must be a string
            if (!ConfigProcessor.validateOptionalProperty(accessory.manufacturer, 'string')) invalidProperties.push('manufacturer');

            // model: if provided, must be a string
            if (!ConfigProcessor.validateOptionalProperty(accessory.model, 'string')) invalidProperties.push('model');

            // serialNumber: if provided, must be a string
            if (!ConfigProcessor.validateOptionalProperty(accessory.serialNumber, 'string')) invalidProperties.push('serialNumber');

            if (invalidProperties.length !== 0) {
                const whichAccessory = ConfigProcessor.getPrintableArrayIndex(accessoryIndex);
                for (let propertyName in invalidProperties) {
                    if (!invalidAccessories.includes(accessoryIndex)) {
                        switch (propertyName) {
                            case 'accessoryName':
                                this.log(`Could not read property '${propertyName}' of the ${whichAccessory} accessory. Every accessory must have a unique name. Skipping accessory...`);
                                invalidAccessories.unshift(accessoryIndex);
                                break;
                            case 'accessoryId':
                                this.log(`Could not read property '${propertyName}' of the ${whichAccessory} accessory. Skipping accessory...`);
                                invalidAccessories.unshift(accessoryIndex);
                                break;
                            default:
                                this.log(`Could not read property '${propertyName}' of the ${whichAccessory} accessory. Ignoring property...`);
                                this.config.accessories[accessoryIndex][propertyName] = null; // Resetting faulty but optional properties
                        }
                    }
                }
            }
        }

        // Removing the invalid accessories...
        for (let accessoryIndex of invalidAccessories) {
            this.config.accessories.splice(accessoryIndex, 1);
        }

        // Assigning ids to all accessories...
        const validatedAccessories = [];
        const accessoryIds = [];

        // Extracting all accessories with specified accessoryId's...
        for (let accessory of this.config.accessories) {
            if (accessory.accessoryId != null) {
                validatedAccessories[accessory.accessoryId] = accessory;
                accessoryIds.push(accessory.accessoryId);
            }
        }

        for (let accessoryIndex in this.config.accessories) {
            if (this.config.accessories[accessoryIndex].accessoryId == null) {
                let accessoryId = accessoryIndex;
                let maxLaps = 15;
                while (accessoryIds.includes(accessoryId) && maxLaps >= 0) {
                    if (accessoryId === 15) accessoryId = 0;
                    else accessoryId++;
                    maxLaps--;
                }
                if (accessoryIds.includes(accessoryId)) {
                    this.log.error('FATAL ERROR! Overlapping accessoryIds! Unable to add/restore any accessories!'); // TODO: This error does an unnecessary double-check and will be removed after testing.
                    return;
                }
                this.config.accessories[accessoryIndex].accessoryId = accessoryId;
                validatedAccessories[accessoryId] = this.config.accessories[accessoryIndex];
            }
        }

        this.config.accessories = validatedAccessories;

        return this.config;
    }
    static validateProperty(property, expectedType) {
        return property != null && typeof property === expectedType;
    }
    static validateNumber(number, min, max) {
        return this.validateProperty(number, 'number') && number >= min && number <= max;
    }
    static validateOptionalProperty(property, expectedType) {
        return property == null || this.validateProperty(property, expectedType);
    }
    static validateOptionalNumber(number, min, max) {
        return number == null || this.validateNumber(number, min, max);
    }
    static getPrintableArrayIndex(index) {
        index++;
        switch (index) {
            case 0:
                return index += 'st';
            case 1:
                return index += 'nd';
            case 2:
                return index += 'rd';
            default:
                return index += 'th';
        }
    }
}

module.exports = ConfigProcessor;

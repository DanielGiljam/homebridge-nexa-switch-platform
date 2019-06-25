/*

Copyright 2019 Daniel Giljam

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

"use strict"

const fs = require("fs")
const spawn = require("child_process").spawn

const OperationSequencer = require("./utility/operation-sequencer")

const BROADCAST_ID = -1

let PlatformAccessory, Characteristic, Service, UUIDGen, Logger

module.exports = homebridge => {

    PlatformAccessory = homebridge.platformAccessory

    Characteristic = homebridge.hap.Characteristic
    Service = homebridge.hap.Service

    UUIDGen = homebridge.hap.uuid
    Logger = homebridge.Logger

    homebridge.registerPlatform("homebridge-nexa-switch-platform", "NexaSwitchPlatform", NexaSwitchPlatform, true)

}

function NexaSwitchPlatform(log, config, api) {

    if (api == null) throw new Error(
        "API parameter was not passed when the NexaSwitchPlatform constructor was called! " +
        "Check the version of your Homebridge installation. It may be outdated.")

    this.config = this.validateConfig(config)
    this.log = log

    this.accessories = []
    this.accessoriesToBeRegistered = []
    this.accessoriesToBeUnregistered = []

    this.stateMonitor = []
    for (let index in this.config.accessories) {
        this.stateMonitor.push({
            accessoryId: this.config.accessories[index].accessoryId,
            state: undefined
        })
    }

    this.operationSequencer = new OperationSequencer(async (queue) => {
        return await new Promise((resolve, reject) => {
            const process = spawn("../homebridge-nexa-switch-platform/scripts/piHomeEasyExtended.sh",
                [
                    this.config.transmitterPin,
                    this.config.emitterId,
                    ...this.manufactureArguments(this.optimizeOperation(queue))
                ]
            )
            process.stdout.on("data", data => this.log(`[piHomeEasyExtended] ${data}`.trim()))
            process.stderr.on("data", data => this.log.error(`[piHomeEasyExtended] ${data}`.trim()))
            process.on("close", code => {
                this.log(`[piHomeEasyExtended] Script finished and closed with code ${code}.`)
                resolve(code.toString())
            })
            process.on("exit", code => {
                this.log(`[piHomeEasyExtended] Script exited with code ${code}.`)
                resolve(code.toString())
            })
            process.on("error", error => {
                reject(error)
            })
        }).catch(error => {
            throw error
        })
    }, log)

    api.on("didFinishLaunching", () => {
        this.accessoriesToBeUnregistered = this.accessories
        for (let index in this.config.accessories) {
            this.addAccessory(this.config.accessories[index])
        }
        if (this.accessoriesToBeRegistered.length !== 0) {
            api.registerPlatformAccessories(
                "homebridge-nexa-switch-platform",
                "NexaSwitchPlatform",
                this.accessoriesToBeRegistered)
        }
        if (this.accessoriesToBeUnregistered.length !== 0) {
            this.log(`Removing ${this.accessoriesToBeUnregistered.length} deprecated accessories...`)
            api.unregisterPlatformAccessories(
                "homebridge-nexa-switch-platform",
                "NexaSwitchPlatform",
                this.accessoriesToBeUnregistered)
        }
        this.log("Finished launching...")
    })

}

NexaSwitchPlatform.prototype.validateConfig = function (config) {

    const validateProperty = function (property, expectedType) {
        return property != null && typeof property === expectedType
    }
    const validateNumber = function (number, min, max) {
        return validateProperty(number, "number") && number >= min && number <= max
    }
    const validateOptionalProperty = function (property, expectedType) {
        return property == null || validateProperty(property, expectedType)
    }
    const validateOptionalNumber = function (number, min, max) {
        return number == null || validateNumber(number, min, max)
    }
    const getPrintableArrayIndex = function (index) {
        index++
        switch (index) {
            case 0:
                return index += "st"
            case 1:
                return index += "nd"
            case 2:
                return index += "rd"
            default:
                return index += "th"
        }
    }

    // Validating the platform's parameters...

    const invalidProperties = []

    // transmitterPin: must be a number, min. 0, max. 16
    if (!validateNumber(config.transmitterPin, 0, 16)) invalidProperties.push("transmitterPin")

    // emitterId: must be a number, min. 1, max. 67108862
    if (!validateNumber(config.emitterId, 1, 67108862)) invalidProperties.push("emitterId")

    if (invalidProperties.length !== 0) {
        const fallbackConfig = JSON.parse(`${fs.readFileSync(/* CHANGE TO THIS BEFORE PRODUCTION: './../homebridge-nexa-switch-platform/miscellaneous/fallback-config.json' */"./miscellaneous/fallback-config.json")}`)
        for (let propertyName of invalidProperties) {
            this.log.error(`Could not read property '${propertyName}'. Assigning default value: ${fallbackConfig[propertyName]}.`)
            config[propertyName] = fallbackConfig[propertyName]
        }
    }

    // If the config's list of accessories' length surpasses the HomeEasy protocol's accessory limit, then the validation returns false.
    if (config.accessories.length > 16) {
        this.log.error("Amount of accessories declared in the config exceeds the maximum amount of accessories allowed (16). Unable to add/restore any accessories.")
        config.accessories = []
        return config
    }

    // Spotting out invalid accessories...
    const invalidAccessories = []
    for (let accessoryIndex in config.accessories) {

        const accessory = config.accessories[accessoryIndex]
        const invalidProperties = []

        // accessoryName: must be a string
        if (!validateProperty(accessory.accessoryName, "string")) invalidProperties.push("accessory")

        // accessoryId: if provided, must be a number, min. 0, max. 15
        if (!validateOptionalNumber(accessory.accessoryId, 0, 15)) invalidProperties.push("accessoryId")

        // manufacturer: if provided, must be a string
        if (!validateOptionalProperty(accessory.manufacturer, "string")) invalidProperties.push("manufacturer")

        // model: if provided, must be a string
        if (!validateOptionalProperty(accessory.model, "string")) invalidProperties.push("model")

        // serialNumber: if provided, must be a string
        if (!validateOptionalProperty(accessory.serialNumber, "string")) invalidProperties.push("serialNumber")

        if (invalidProperties.length !== 0) {
            const whichAccessory = getPrintableArrayIndex(accessoryIndex)
            for (let propertyName of invalidProperties) {
                if (!invalidAccessories.includes(accessoryIndex)) {
                    switch (propertyName) {
                        case "accessoryName":
                            this.log.error(`Could not read property '${propertyName}' of the ${whichAccessory} accessory. Every accessory must have a unique name. Skipping accessory...`)
                            invalidAccessories.unshift(accessoryIndex)
                            break
                        case "accessoryId":
                            this.log.error(`Could not read property '${propertyName}' of the ${whichAccessory} accessory. Skipping accessory...`)
                            invalidAccessories.unshift(accessoryIndex)
                            break
                        default:
                            this.log.error(`Could not read property '${propertyName}' of the ${whichAccessory} accessory. Ignoring property...`)
                            config.accessories[accessoryIndex][propertyName] = null // Resetting faulty but optional properties
                    }
                }
            }
        }
    }

    // Removing the invalid accessories...
    for (let accessoryIndex of invalidAccessories) {
        config.accessories.splice(accessoryIndex, 1)
    }

    // Assigning ids to all accessories...
    const validatedAccessories = []
    const accessoryIds = []

    // Extracting all accessories with specified accessoryId's...
    for (let accessory of config.accessories) {
        if (accessory.accessoryId != null) {
            validatedAccessories[accessory.accessoryId] = accessory
            accessoryIds.push(accessory.accessoryId)
        }
    }

    for (let accessoryIndex in config.accessories) {
        if (config.accessories[accessoryIndex].accessoryId == null) {
            let accessoryId = parseInt(accessoryIndex)
            let maxLaps = 15
            while (accessoryIds.includes(accessoryId) && maxLaps > 0) {
                if (accessoryId === 15) accessoryId = 0
                else accessoryId++
                maxLaps--
            }
            accessoryIds.push(accessoryId)
            config.accessories[accessoryIndex].accessoryId = accessoryId
            validatedAccessories[accessoryId] = config.accessories[accessoryIndex]
        }
    }

    config.accessories = validatedAccessories

    return config
}

NexaSwitchPlatform.prototype.addAccessory = function (accessoryInformation) {

    let uuid = UUIDGen.generate(accessoryInformation.accessoryName)
    if (this.accessoryRegistered(uuid)) {
        return
    }

    this.log(`Adding accessory '${accessoryInformation.accessoryName}'...`)

    const accessory = new PlatformAccessory(accessoryInformation.accessoryName, uuid)

    accessory.context.name = accessoryInformation.accessoryName
    accessory.context.accessoryId = accessoryInformation.accessoryId

    accessory.context.manufacturer = (accessoryInformation.manufacturer != null) ? accessoryInformation.manufacturer : "N/A"
    accessory.context.model = (accessoryInformation.model != null) ? accessoryInformation.model : "N/A"
    accessory.context.serialNumber = (accessoryInformation.serialNumber != null) ? accessoryInformation.serialNumber : "N/A"

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessory.context.manufacturer)
        .setCharacteristic(Characteristic.Model, accessory.context.model)
        .setCharacteristic(Characteristic.SerialNumber, accessory.context.serialNumber)

    const switchService = accessory.addService(Service.Switch, accessoryInformation.accessoryName)
    switchService.getCharacteristic(Characteristic.On)
        .on("set", this.setSwitchOnCharacteristic.bind({
            operationSequencer: this.operationSequencer,
            accessoryId: accessory.context.accessoryId
        }))
        .getValue(function (error, value) {
            if (error != null) throw error
            if (value != null) {
                this.stateMonitor.find(element => element.accessoryId === this.accessoryId).state = !!value
            }
        }.bind({
            stateMonitor: this.stateMonitor,
            accessoryId: accessory.context.accessoryId
        }))

    this.accessoriesToBeRegistered.push(accessory)
}

NexaSwitchPlatform.prototype.configureAccessory = function (accessory) {

    this.log(`Restoring accessory '${accessory.context.name}'...`)

    const accessoryInformation = this.config.accessories.find(element => {
        return (element != null) ? element.accessoryName === accessory.context.name : false
    })

    if (accessoryInformation != null) {
        accessory.context.name = accessoryInformation.accessoryName
        accessory.context.accessoryId = accessoryInformation.accessoryId

        accessory.context.manufacturer = (accessoryInformation.manufacturer != null) ? accessoryInformation.manufacturer : "N/A"
        accessory.context.model = (accessoryInformation.model != null) ? accessoryInformation.model : "N/A"
        accessory.context.serialNumber = (accessoryInformation.serialNumber != null) ? accessoryInformation.serialNumber : "N/A"
    }

    accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, accessory.context.manufacturer)
        .setCharacteristic(Characteristic.Model, accessory.context.model)
        .setCharacteristic(Characteristic.SerialNumber, accessory.context.serialNumber)

    const switchService = accessory.getService(Service.Switch)
    switchService.getCharacteristic(Characteristic.On)
        .on("set", this.setSwitchOnCharacteristic.bind({
            operationSequencer: this.operationSequencer,
            accessoryId: accessory.context.accessoryId
        }))
        .getValue(function (error, value) {
            if (error != null) throw error
            if (value != null) {
                try {
                    this.stateMonitor.find(element => element.accessoryId === this.accessoryId).state = !!value
                } catch (error) {
                    if (error instanceof TypeError) return
                }
            }
        }.bind({
            stateMonitor: this.stateMonitor,
            accessoryId: accessory.context.accessoryId
        }))

    this.accessories.push(accessory)
}

NexaSwitchPlatform.prototype.accessoryRegistered = function (uuid) {

    for (let index in this.accessoriesToBeUnregistered) {
        if (this.accessoriesToBeUnregistered[index].UUID === uuid) {
            this.accessoriesToBeUnregistered.splice(index, 1)
            return true
        }
    }
    return false
}

NexaSwitchPlatform.prototype.setSwitchOnCharacteristic = function (on, next) {

    const state = !!on
    this.operationSequencer.sendOp({accessoryId: this.accessoryId, state: state})
    return next()
}

NexaSwitchPlatform.prototype.optimizeOperation = function (queue) {

    const queueToDeltaState = function (state, queue) {
        const deltaState = state.map(element => Object.assign({}, element))
        for (let operation of queue) {
            deltaState.find(element => element.accessoryId === operation.accessoryId).state = operation.state
        }
        return deltaState
    }

    const separateAltered = function (state, deltaState) {
        const altered = []
        const unaltered = []
        for (let index in deltaState) {
            if (state[index].state !== deltaState[index].state) altered.push(deltaState[index])
            else unaltered.push(deltaState[index])
        }
        return [altered, unaltered]
    }

    const determineUnionUnalteredState = function (unaltered) {
        if (unaltered.length !== 0) {
            let unionUnalteredState = unaltered[0].state
            for (let stateObject of unaltered) if (stateObject.state !== unionUnalteredState) unionUnalteredState = null
            return unionUnalteredState
        } else {
            return true
        }
    }

    const state = this.stateMonitor.map(element => Object.assign({}, element))
    const deltaState = queueToDeltaState(state, queue)
    this.stateMonitor = deltaState.map(element => Object.assign({}, element))
    // this.log('State:');
    // console.log(state);
    // this.log('DeltaState:');
    // console.log(deltaState);

    let altered, unaltered;
    [altered, unaltered] = separateAltered(state, deltaState)
    // this.log('Altered:');
    // console.log(altered);
    // this.log('Unaltered:');
    // console.log(unaltered);

    const unionUnalteredState = determineUnionUnalteredState(unaltered)
    // this.log(`UnionUnalteredState (null if the unaltered state's aren't union): ${unionUnalteredState}`);

    const inFavour = deltaState.filter(element => element.state === unionUnalteredState)
    // this.log('InFavour (of group operation to unionUnalteredState):');
    // console.log(inFavour);
    const notInFavour = deltaState.filter(element => element.state !== unionUnalteredState)
    // this.log('NotInFavour (of group operation to unionUnalteredState):');
    // console.log(notInFavour);

    let quota = (inFavour.length - unaltered.length) / (deltaState.length - unaltered.length)
    if (quota < 0) quota = 0
    // this.log(`Quota: ${quota.toFixed(2)}`);

    if (quota === 0) {
        return altered
    } else if (quota > 0.5) {
        // this.log(`Using ${BROADCAST_ID} to perform group operation to unionUnalteredState: '${unionUnalteredState}'`);
        notInFavour.unshift({
            accessoryId: BROADCAST_ID,
            state: unionUnalteredState
        })
        return notInFavour
    } else {
        // this.log(`Using ${BROADCAST_ID} to perform group operation to !unionUnalteredState: '${!unionUnalteredState}'`);
        inFavour.unshift({
            accessoryId: BROADCAST_ID,
            state: !unionUnalteredState
        })
        return inFavour
    }
}

NexaSwitchPlatform.prototype.manufactureArguments = function (queue) {
    const argArray = []
    for (let queueObject of queue) {
        argArray.push(queueObject.accessoryId, (queueObject.state) ? "on" : "off")
    }
    return argArray
}

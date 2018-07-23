const http = require('http');
let Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    // Accessory must be created from the PlatformAccessory constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-node.js
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-nexa-switch-platform", "NexaSwitchPlatform", NexaSwitchPlatform, true);
};

// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
function NexaSwitchPlatform(log, config, api) {
    const platform = this;
    this.log = log;
    this.config = config;
    this.accessories = [];

    // TODO: Request number of switch accessories to add, default to 0 in case of no response

    if (api) {
        // Save the API object as plugin needs to register new accessory via this object
        this.api = api;

        // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories.
        // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
        // Or start discover new accessories.
        this.api.on('didFinishLaunching', function () {
            platform.log("DidFinishLaunching");
        }.bind(this));
    }
}

// Function invoked when homebridge tries to restore cached accessory.
// Developer can configure accessory at here (like setup event handler).
// Update current value.
NexaSwitchPlatform.prototype.configureAccessory = function (accessory) {
    this.log(accessory.displayName, "Configure Accessory");
    const platform = this;

    // Set the accessory to reachable if plugin can currently process the accessory,
    // otherwise set to false and update the reachability later by invoking
    // accessory.updateReachability()
    accessory.reachable = true;

    accessory.on('identify', function (paired, callback) {
        platform.log(accessory.displayName, "Identify!!!");
        callback();
    });

    if (accessory.getService(Service.Lightbulb)) {
        accessory.getService(Service.Lightbulb)
            .getCharacteristic(Characteristic.On)
            .on('set', function (value, callback) {
                platform.log(accessory.displayName, "Light -> " + value);
                callback();
            });
    }

    this.accessories.push(accessory);
};

// Handler will be invoked when user try to config your plugin.
// Callback can be cached and invoke when necessary.
NexaSwitchPlatform.prototype.configurationRequestHandler = function (context, request, callback) {
    this.log("Context: ", JSON.stringify(context));
    this.log("Request: ", JSON.stringify(request));

    // Check the request response
    if (request && request.response && request.response.inputs && request.response.inputs.name) {
        this.addAccessory(request.response.inputs.name);

        // Invoke callback with config will let homebridge save the new config into config.json
        // Callback = function(response, type, replace, config)
        // set "type" to platform if the plugin is trying to modify platforms section
        // set "replace" to true will let homebridge replace existing config in config.json
        // "config" is the data platform trying to save
        callback(null, "platform", true, {"platform": "NexaSwitchPlatform", "otherConfig": "SomeData"});
        return;
    }

    // - UI Type: Input
    // Can be used to request input from user
    // User response can be retrieved from request.response.inputs next time
    // when configurationRequestHandler being invoked

    const respDict = {
        "type": "Interface",
        "interface": "input",
        "title": "Add Accessory",
        "items": [
            {
                "id": "name",
                "title": "Name",
                "placeholder": "Fancy Light"
            }//,
            // {
            //   "id": "pw",
            //   "title": "Password",
            //   "secure": true
            // }
        ]
    };

    // - UI Type: List
    // Can be used to ask user to select something from the list
    // User response can be retrieved from request.response.selections next time
    // when configurationRequestHandler being invoked

    // var respDict = {
    //   "type": "Interface",
    //   "interface": "list",
    //   "title": "Select Something",
    //   "allowMultipleSelection": true,
    //   "items": [
    //     "A","B","C"
    //   ]
    // }

    // - UI Type: Instruction
    // Can be used to ask user to do something (other than text input)
    // Hero image is base64 encoded image data. Not really sure the maximum length HomeKit allows.

    // var respDict = {
    //   "type": "Interface",
    //   "interface": "instruction",
    //   "title": "Almost There",
    //   "detail": "Please press the button on the bridge to finish the setup.",
    //   "heroImage": "base64 image data",
    //   "showActivityIndicator": true,
    // "showNextButton": true,
    // "buttonText": "Login in browser",
    // "actionURL": "https://google.com"
    // }

    // Plugin can set context to allow it track setup process
    context.ts = "Hello";

    // Invoke callback to update setup UI
    callback(respDict);
};

// Sample function to show how developer can add accessory dynamically from outside event
NexaSwitchPlatform.prototype.addAccessory = function (accessoryIndex) {
    this.log("Add Accessory");
    const platform = this;
    const accessoryName = "Switch " + accessoryIndex;
    const uuid = UUIDGen.generate(accessoryName);

    const newAccessory = new Accessory(accessoryName, uuid);
    newAccessory.on('identify', function (paired, callback) {
        platform.log(newAccessory.displayName, "Identify!!!");
        callback();
    });
    // Plugin can save context on accessory to help restore accessory in configureAccessory()
    // newAccessory.context.something = "Something"

    // Make sure you provided a name for service, otherwise it may not visible in some HomeKit apps
    newAccessory.addService(Service.Lightbulb, "Test Light")
        .getCharacteristic(Characteristic.On)
        .on('set', function (value, callback) {
            platform.log(newAccessory.displayName, "Light -> " + value);
            callback();
        });

    this.accessories.push(newAccessory);
    this.api.registerPlatformAccessories("homebridge-nexa-switch-platform", "NexaSwitchPlatform", [newAccessory]);
};

NexaSwitchPlatform.prototype.updateAccessoriesReachability = function () {
    this.log("Update Reachability");
    for (let index in this.accessories) {
        const accessory = this.accessories[index];
        accessory.updateReachability(false);
    }
};

// Sample function to show how developer can remove accessory dynamically from outside event
NexaSwitchPlatform.prototype.removeAccessory = function () {
    this.log("Remove Accessory");
    this.api.unregisterPlatformAccessories("homebridge-nexa-switch-platform", "NexaSwitchPlatform", this.accessories);

    this.accessories = [];
};
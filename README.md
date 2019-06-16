# homebridge-nexa-switch-platform

This is a [Homebridge](https://www.npmjs.com/package/homebridge) plugin for controlling remote controlled power switches manufactured by Nexa.
It may potentially work with any switch-like device communicating over the HomeEasy protocol.

The prerequisites are:
- A Raspberry Pi Model A or B (any generation)
- An external radio transmitter connected to your Pi's GPIO that transmits on the 433 MHz frequency
- piHomeEasy: a software for communicating with devices using the HomeEasy protocol ([github.com/nbogojevic/piHomeEasy](https://github.com/nbogojevic/piHomeEasy)) --> Check out its GitHub page for details on how to set up

In your **_`config.json`_** -file, the following information needs to be added in order for the Nexa Switch Platform to be set up:
```json
{
  "bridge": {
    ...
  },
  "platforms": [
    {
      "platform": "NexaSwitchPlatform",
      "transmitterPin": 0,
      "emitterId": 31415,
      "accessories": [
        {
          "accessoryName": "Example Switch",
          "accessoryId": 0,
          "manufacturer": "Example Manufacturer",
          "model": "Example Model",
          "serialNumber": "XXX000000000"
        }
      ]
    }
  ]
}
```
An example configuration file can be found in the _.homebridge_ -folder inside this package.

# homebridge-nexa-switch-platform

This is a [Homebridge](https://www.npmjs.com/package/homebridge) plugin for controlling remote controlled power switches manufactured by Nexa.
It may potentially work with any 'switch -like' device communicating over the HomeEasy protocol.

The prerequisites are:
- An external radio transmitter that transmits on the 433 MHz frequency connected to your Pi's GPIO
- piHomeEasy: a software for controlling devices using the HomeEasy protocol ([github.com/nbogojevic/piHomeEasy](https://github.com/nbogojevic/piHomeEasy))
- Wiring Pi: a library for accessing the Pi's GPIO. The piHomeEasy software depends on it. ([wiringpi.com](http://wiringpi.com))

In your **_`config.json`_** -file, the following information needs to be added in order for the Nexa Switch Platform to be set up:
```json
{
  "bridge": {
    ...
  },
  "accessories": {
    ...
  },
  "platforms": [
    {
      "platform": "NexaSwitchPlatform",
      "name": "Nexa Switch Platform",
      "emitterId": 31415,
      "accessoryInformation": [
        {
          "name": "Switch",
          "manufacturer": "Nexa",
          "model": "PER-1500",
          "serialNumber": "481-48-592"
        }
      ]
    },
    ...
  ]
}
```
An example configuration file can be found in the _.homebridge_ -folder inside this package.
# homebridge-nexa-switch-platform

This is a [Homebridge](https://www.npmjs.com/package/homebridge) plugin for controlling remote controlled power switches manufactured by Nexa.
It may potentially work with any switch-like device communicating over the HomeEasy protocol.

The prerequisites are:
- A Raspberry Pi Model A or B (any generation)
- An external radio transmitter connected to your Pi's GPIO that transmits on the 433 MHz frequency
- piHomeEasy: a software for communicating with devices using the HomeEasy protocol ([github.com/nbogojevic/piHomeEasy](https://github.com/nbogojevic/piHomeEasy)) --> Check out its GitHub page for details on how to get it and install it

More information about the radio transmitter and how to connect it to the Pi can also be found on piHomeEasy's GitHub page.

**NOTE!**
After you've installed piHomeEasy, you need to make sure it's executable by others and that it has the setuid bit set. 
Example of what piHomeEasy's properties should look like:

```bash
$ ls -l `which piHomeEasy`
-rwsr-xr-x 1 root staff 19056 Jun 27  2019 /usr/local/bin/piHomeEasy
```

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

const information = require('../utils/information');
const services = require('../utils/services');
const utils = require('../utils/utils');

const discover = {
  DiscoverDevicesIntent() {
    // user asks to discover devices
    utils.log('DiscoverDevicesIntent', this.event);

    return services
      .discover()
      .then(result => {
        if (!result) {
          // MyQ service down
          this.attributes.devices = []; // clear out stored list of devices
          return this.emit('MyQServiceDown');
        }

        const { code, devices } = result;

        if (code !== 'OK') {
          // catch error
          return this.emit('ServiceErrorHandler', code);
        }

        // parse list of devices
        let index = 1;
        for (let i = devices.length - 1; i >= 0; i -= 1) {
          const device = devices[i];
          if (!device.serial_number) {
            devices.splice(i, 1); // remove device if no ID
          } else if (!device.name) {
            device.name = `Device ${index}`; // default name if not found in endpoint response
            index += 1;
          }
        }
        this.attributes.devices = devices; // store list of devices
        return this.emit('emit', {
          type: 'tellWithCard',
          speechOutput: `Discovery is complete. ${information.listDevices(devices)}`,
          cardTitle: 'Discovered Devices',
          cardContent: information.describeDevicesCard(devices),
        });
      })
      .catch(err => {
        utils.log('DiscoverDevicesIntent - Error', err);
      });
  },
};

module.exports = discover;

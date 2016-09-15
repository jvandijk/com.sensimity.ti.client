import sensimityConfig from '../config/config';
import { _ } from 'alloy/underscore';
import Timer from 'ti.mely';
import client from '../client/client';
import { createSensimityCollection, createSensimityModel } from '../utils/backbone';
import knownBeaconService from './knownBeacons';

export default class BeaconLog {
  constructor() {
    // Send beaconlogs every 30 seconds
    this.timer = Timer.createTimer();
    this.timer.start({
      interval: 30000,
    });
    this.sendBeaconLogs = this.sendBeaconLogs.bind(this);
    this.timer.addEventListener('onIntervalChange', this.sendBeaconLogs);
    this.sendBeaconLogs();
  }

  sendBeaconLogs() {
    if (!Ti.Network.getOnline()) {
      return;
    }

    const sendBeaconLogsAfterFetch = beaconLogs => {
        // Send beaconlogs only if exists
      if (beaconLogs.length === 0) { return; }
      client.sendScanResults({
        instance_ref: sensimityConfig.instanceRef,
        device: {
          device_id: Ti.Platform.id,
          model: Ti.Platform.model,
          operating_system: Ti.Platform.osname,
          version: Ti.Platform.version,
        },
        beaconLogs: beaconLogs.toJSON(),
      }, this.destroyBeaconLogs);
    };

    const library = createSensimityCollection('BeaconLog');
    library.fetch({
      success: sendBeaconLogsAfterFetch, // eslint-disable-line
    });
  }

  insertBeaconLog(beacon) {
    const knownBeacon = knownBeaconService.findKnownBeacon(beacon.UUID, beacon.major, beacon.minor);
    beacon.timestamp = Math.round(new Date().getTime() / 1000);
      // If beacon = unknown, do nothing
    if (!_.isEmpty(knownBeacon)) {
      beacon.beacon_id = knownBeacon.get('beacon_id');
    }
    const beaconLog = createSensimityModel('BeaconLog', beacon);
    beaconLog.save();
  }

  destroyBeaconLogs() {
    const collection = createSensimityCollection('BeaconLog');
    collection.erase();
  }
}

import OddSockets from './OddSockets';
import Channel from './Channel';
import PubNubCompat from './PubNubCompat';
import ManagerDiscovery from './ManagerDiscovery';
import { EnhancedFeatures } from './EnhancedFeatures';

// Create the main export object that works with React Native
const OddSocketsSDK: any = OddSockets;

// Attach additional exports to the main constructor
OddSocketsSDK.OddSockets = OddSockets;
OddSocketsSDK.Channel = Channel;
OddSocketsSDK.PubNubCompat = PubNubCompat;
OddSocketsSDK.ManagerDiscovery = ManagerDiscovery;

// Version info
OddSocketsSDK.version = require('../package.json').version;

// Convenience factory function
OddSocketsSDK.create = function(config: any) {
  return new OddSockets(config);
};

// PubNub compatibility factory
OddSocketsSDK.createPubNubCompat = function(config: any) {
  return new PubNubCompat(config);
};

// Export the main object
export default OddSocketsSDK;

// Named exports for better tree-shaking
export { OddSockets, Channel, PubNubCompat, ManagerDiscovery, EnhancedFeatures };

// Type exports
export * from './types';

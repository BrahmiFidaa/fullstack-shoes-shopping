import { registerRootComponent } from 'expo';

console.log('[Index] Loading App...');

import App from './App';

console.log('[Index] App imported successfully');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

console.log('[Index] App registered');

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// Register FCM background handler & foreground listeners
import './src/push/messagingSetup';

AppRegistry.registerComponent(appName, () => App);

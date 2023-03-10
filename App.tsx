/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import Main from './Screens/Main';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import { useColorScheme, View } from 'react-native';
import { DeviceProvider } from './BLE components/DeviceContext';
function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  return (
    <DeviceProvider>
      <Main></Main>
    </DeviceProvider>
    );
}
export default App;

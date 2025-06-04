/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';
import { ClientProvider } from './src/contexts/ClientContext';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#03DAC6',
  },
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ClientProvider>
          <HomeScreen />
        </ClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;

import React from 'react';
import { View, Text } from 'react-native';
import Navigation from './src/navigation';
import { Provider } from 'react-redux';
import store from './src/store';
import ErrorBoundary from './src/components/ErrorBoundary';

console.log('[App] Starting app initialization...');

export default function App() {
  console.log('[App] App component rendering...');
  
  try {
    return (
      <ErrorBoundary>
        <Provider store={store}>
          <Navigation />
        </Provider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('[App] Critical error during render:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>App Error</Text>
        <Text>{error.toString()}</Text>
      </View>
    );
  }
}
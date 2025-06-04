import React from 'react';
import { View, StyleSheet } from 'react-native';
import PayrollChecklist from '../components/PayrollChecklist';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <PayrollChecklist />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default HomeScreen; 
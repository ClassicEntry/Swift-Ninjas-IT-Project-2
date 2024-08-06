import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';

export default function AnotherScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Another Screen</Text>
    </View>
  );
}
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Menu</Text>
      <Text style={styles.subtitle}>Settings, Profile, and Logout options.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f6f7fb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  }
});
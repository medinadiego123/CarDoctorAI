import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const manager = new BleManager();

const BluetoothScanner = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [dtcCodes, setDtcCodes] = useState<string[]>([]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }
    return () => {
      manager.destroy();
    };
  }, []);

  const startScan = () => {
    setScanning(true);
    const mockDevices: Device[] = [
      { id: '1', name: 'OBDII-Sim A' } as Device,
      { id: '2', name: 'OBDII-Sim B' } as Device,
      { id: '3', name: 'OBDII-Sim C' } as Device,
    ];

    setTimeout(() => {
      setDevices(mockDevices);
      setScanning(false);
    }, 1000);
  };

  const connectToDevice = async (device: Device) => {
    setConnectedDevice(device);
    Alert.alert(`(Mock) Connected to ${device.name}`);
  };

  const readErrorCodes = async () => {
    const mockHex = '43 01 30 31 02 42 30';
    Alert.alert('Raw DTC Hex', mockHex);
    const codes = decodeDTCs(mockHex);
    setDtcCodes(codes);
    Alert.alert('Decoded Codes', codes.join(', '));
  };

  const decodeDTCs = (hexStr: string): string[] => {
    const hex = hexStr.replace(/\s+/g, '');
    const bytes = hex.match(/.{1,2}/g);
    if (!bytes || bytes.length < 1 || bytes[0] !== '43') return [];

    const codes: string[] = [];
    for (let i = 1; i < bytes.length; i += 2) {
      const high = parseInt(bytes[i], 16);
      const low = parseInt(bytes[i + 1], 16);

      if (isNaN(high) || isNaN(low)) continue;

      const firstChar = ['P', 'C', 'B', 'U'][(high & 0xC0) >> 6];
      const dtc =
        firstChar +
        ((high & 0x3F) >> 4).toString() +
        (high & 0x0F).toString() +
        low.toString(16).padStart(2, '0').toUpperCase();
      codes.push(dtc);
    }

    return codes;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 CarDoctor AI</Text>
      <TouchableOpacity
        style={[styles.button, scanning && styles.buttonDisabled]}
        onPress={startScan}
        disabled={scanning}
      >
        <Text style={styles.buttonText}>
          {scanning ? 'Scanning...' : 'Scan for Devices'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() =>
          devices.length > 0 && (
            <Text style={styles.sectionTitle}>Available Devices</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.deviceCard}>
            <Text style={styles.deviceText}>{item.name}</Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => connectToDevice(item)}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {connectedDevice && (
        <>
          <Text style={styles.sectionTitle}>Connected: {connectedDevice.name}</Text>
          <TouchableOpacity style={styles.readButton} onPress={readErrorCodes}>
            <Text style={styles.buttonText}>Read OBD-II Error Codes</Text>
          </TouchableOpacity>
        </>
      )}

      {dtcCodes.length > 0 && (
        <View style={styles.dtcBox}>
          <Text style={styles.sectionTitle}>Detected Codes</Text>
          {dtcCodes.map((code, idx) => (
            <Text key={idx} style={styles.dtcCode}>
              • {code}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d8ff',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 10,
  },
  deviceCard: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  deviceText: {
    color: '#fff',
    fontSize: 16,
  },
  connectButton: {
    backgroundColor: '#00d8ff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  readButton: {
    marginTop: 20,
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  dtcBox: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  dtcCode: {
    color: '#f8f8f8',
    fontSize: 16,
    paddingVertical: 2,
  },
  button: {
    backgroundColor: '#00d8ff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BluetoothScanner;

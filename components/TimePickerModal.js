import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const TimePickerModal = ({ visible, initialTime, onConfirm, onCancel }) => {
  // initialTime should be "HH:MM" (24h or 12h)
  let initialDate = new Date();
  if (initialTime && /^\d{2}:\d{2}$/.test(initialTime)) {
    const [h, m] = initialTime.split(':').map(Number);
    initialDate.setHours(h);
    initialDate.setMinutes(m);
    initialDate.setSeconds(0);
    initialDate.setMilliseconds(0);
  }
  const [time, setTime] = useState(initialDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            is24Hour={false}
            onChange={(event, selectedDate) => {
              if (event.type === 'set' && selectedDate) {
                setTime(selectedDate);
              }
            }}
            style={{ backgroundColor: '#fff' }}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => onConfirm(time)}>
              <Text style={[styles.buttonText, { color: '#0277BD' }]}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: 320,
    alignItems: 'center',
    elevation: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
});

export default TimePickerModal;

import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, Button, FlatList, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

const initialTasks = [
  { id: '1', title: 'Task 1', description: 'Description 1', dueDate: new Date(), recurring: false, status: 'pending', interval: '' },
  { id: '2', title: 'Task 2', description: 'Description 2', dueDate: new Date(), recurring: true, interval: 'daily', status: 'pending' }
];

export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: new Date(), recurring: false, interval: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scheduleNotifications = async () => {
      await Notifications.requestPermissionsAsync();
      tasks.forEach(task => {
        if (task.recurring) {
          let triggerConfig = {};
          if (task.interval === 'daily') {
            triggerConfig = { hour: 9, minute: 0, repeats: true };
          } else if (task.interval === 'weekly') {
            triggerConfig = { weekday: new Date().getDay(), hour: 9, minute: 0, repeats: true };
          } else if (task.interval === 'fortnightly') {
            triggerConfig = { weekday: new Date().getDay(), hour: 9, minute: 0, repeats: true, interval: 14 };
          }
          Notifications.scheduleNotificationAsync({
            content: { title: 'Recurring Task Reminder', body: `${task.title} is due!` },
            trigger: triggerConfig
          });
        }
      });
    };
    scheduleNotifications();
  }, [tasks]);

  const handleSaveTask = () => {
    if (editingTaskId !== null) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTaskId ? { ...newTask, id: editingTaskId } : task
        )
      );
      setEditingTaskId(null);
    } else {
      const id = (tasks.length + 1).toString();
      const updatedTask = { ...newTask, id, dueDate: new Date(newTask.dueDate) };
      setTasks(prevTasks => [...prevTasks, updatedTask]);
    }
    setNewTask({ title: '', description: '', dueDate: new Date(), recurring: false, interval: '' });
    setModalVisible(false);
  };

  const handleEditTask = task => {
    setNewTask({ title: task.title, description: task.description, dueDate: task.dueDate, recurring: task.recurring, interval: task.interval });
    setEditingTaskId(task.id);
    setShowDatePicker(true);
  };

  const markTaskAsDone = id => {
    const updatedTasks = tasks.map(task => task.id === id ? { ...task, status: 'done' } : task);
    setTasks(updatedTasks);
  };

  const deleteTask = id => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskDueDate}>Due: {item.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      <Text style={styles.taskStatus}>Status: {item.status}</Text>
      {item.recurring && <Text style={styles.taskRecurring}>Recurring: {item.interval}</Text>}
      <TouchableOpacity style={styles.button} onPress={() => markTaskAsDone(item.id)}>
        <Text style={styles.buttonText}>Mark as Done</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => deleteTask(item.id)}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handleEditTask(item)}>
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const formatDateTime = (date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.currentDateTime}>Today's Date: {formatDateTime(currentDateTime)}</Text>
      <Text style={styles.title}>Welcome to the Event Manager</Text>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Image
          source={require('./icons8-add-button-96.png')}
          style={styles.addButtonImage}
        />
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Task Title"
            value={newTask.title}
            onChangeText={text => setNewTask({ ...newTask, title: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Task Description"
            value={newTask.description}
            onChangeText={text => setNewTask({ ...newTask, description: text })}
          />
          <Picker
            selectedValue={newTask.interval}
            style={styles.picker}
            onValueChange={(itemValue) => setNewTask({ ...newTask, interval: itemValue })}
          >
            <Picker.Item label="Select Interval" value="" />
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Fortnightly" value="fortnightly" />
          </Picker>
          <Button  title="Select Due Date" style ={styles.button} onPress={() => setShowDatePicker(true)} />
          <Button style ={styles.button} title="Select Due Time" onPress={() => setShowTimePicker(true)} />
          {showDatePicker && (
            <DateTimePicker
              value={newTask.dueDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate;
                setShowDatePicker(false);
                setNewTask({ ...newTask, dueDate: new Date(currentDate.setHours(newTask.dueDate.getHours(), newTask.dueDate.getMinutes())) });
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={newTask.dueDate}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                const currentTime = selectedTime;
                setShowTimePicker(false);
                setNewTask({ ...newTask, dueDate: new Date(newTask.dueDate.setHours(currentTime.getHours(), currentTime.getMinutes())) });
              }}
            />
          )}
          <Text>Selected Date and Time: {formatDateTime(newTask.dueDate)}</Text>
          <Button title={editingTaskId ? "Update Task" : "Add Task"} onPress={handleSaveTask} />
          <Button title="Close" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,

  },
  currentDateTime: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eb0c0c',
    borderRadius: 25,
    zIndex: 1, // Ensure the button is above other components
  },
  addButtonImage: {
    width: 50,
    height: 50,
  },
  
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  picker: {
    width: '100%',
    height: 40,
    marginBottom: 10,
  },
  taskItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskDueDate: {
    fontSize: 14,
    color: '#666',
  },
  taskStatus: {
    fontSize: 14,
    color: '#666',
  },
  taskRecurring: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});
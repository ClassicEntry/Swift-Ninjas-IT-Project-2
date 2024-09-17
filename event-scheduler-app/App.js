import React, { useState, useEffect } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, Modal, Image,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import styles from './styles';

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
    setModalVisible(true);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Event Manager</Text>
        <Text style={styles.currentDateTime}>Today's Date: {formatDateTime(currentDateTime)}</Text>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.taskList}
        style={{ flex: 1 }}
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
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.modalView}>
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
            <TouchableOpacity style={styles.customButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.buttonText}>Select Due Date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.customButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.buttonText}>Select Due Time</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={newTask.dueDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  const currentDate = selectedDate || newTask.dueDate;
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
                  const currentTime = selectedTime || newTask.dueDate;
                  setShowTimePicker(false);
                  setNewTask({ ...newTask, dueDate: new Date(newTask.dueDate.setHours(currentTime.getHours(), currentTime.getMinutes())) });
                }}
              />
            )}
            <Text>Selected Date and Time: {formatDateTime(newTask.dueDate)}</Text>
            <TouchableOpacity style={styles.customButton} onPress={handleSaveTask}>
              <Text style={styles.buttonText}>{editingTaskId ? "Update Task" : "Add Task"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.customButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

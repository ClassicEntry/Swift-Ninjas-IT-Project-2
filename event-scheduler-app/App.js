import React, { useState, useEffect } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, Modal,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, FlatList, Alert, Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import styles from './styles';
import * as SQLite from 'expo-sqlite';
import * as Device from 'expo-device';

export default function App() {
  const [db, setDb] = useState(null);
  const [tasks, setTasks] = useState([]);
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

  const initializeDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync('tasks.db');
      setDb(database);
  
      await database.execAsync(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        dueDate TEXT,
        recurring INTEGER,
        interval TEXT,
        status TEXT
      );`);
  
      loadTasksFromDB(database);
    } catch (error) {
      console.log('Error initializing database:', error);
    }
  };
  
  useEffect(() => {
    initializeDatabase();
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
            triggerConfig = { weekday: new Date().getDay(), hour: 9, minute: 0, repeats: true, interval: 7 };
          } else if (task.interval === 'fortnightly') {
            triggerConfig = { weekday: new Date().getDay(), hour: 9, minute: 0, repeats: true, interval: 14 };
          } else if (task.interval === 'monthly') {
            triggerConfig = { day: new Date().getDate(), hour: 9, minute: 0, repeats: true, interval: 30 };
          } else if (task.interval === 'yearly') {
            triggerConfig = { day: new Date().getDate(), month: new Date().getMonth(), hour: 9, minute: 0, repeats: true, interval: 365 };
          }
          Notifications.scheduleNotificationAsync({
            content: { title: 'Recurring Reminder', body: `${task.title} is due!` },
            trigger: triggerConfig
          });
        }
      });
    };
    scheduleNotifications();
  }, [tasks]);

  const loadTasksFromDB = async (database) => {
    try {
      const result = await database.getAllAsync('SELECT * FROM tasks');
      setTasks(result);
    } catch (error) {
      console.log('Error loading tasks:', error);
    }
  };
  
  const handleSaveTask = async () => {
    if (editingTaskId !== null) {
      await db.runAsync(
        'UPDATE tasks SET title = ?, description = ?, dueDate = ?, recurring = ?, interval = ?, status = ? WHERE id = ?',
        [newTask.title, newTask.description, newTask.dueDate.toISOString(), newTask.recurring ? 1 : 0, newTask.interval, 'Pending', editingTaskId]
      );
      setEditingTaskId(null);
    } else {
      await db.runAsync(
        'INSERT INTO tasks (title, description, dueDate, recurring, interval, status) VALUES (?, ?, ?, ?, ?, ?)',
        [newTask.title, newTask.description, newTask.dueDate.toISOString(), newTask.recurring ? 1 : 0, newTask.interval, 'Pending']
      );
    }
    loadTasksFromDB(db);
    setNewTask({ title: '', description: '', dueDate: new Date(), recurring: false, interval: '' });
    setModalVisible(false);
  };
  
  const handleEditTask = async (id) => {
    try {
      const result = await db.getFirstAsync('SELECT * FROM tasks WHERE id = ?', [id]);
      if (result) {
        setNewTask({
          title: result.title,
          description: result.description,
          dueDate: new Date(result.dueDate),
          recurring: result.recurring === 1,
          interval: result.interval
        });
        setEditingTaskId(id);
        setModalVisible(true);
      } else {
        console.log('Task not found');
      }
    } catch (error) {
      console.log('Error fetching task:', error);
    }
  };

  const markTaskAsDone = async (id) => {
    await db.runAsync('UPDATE tasks SET status = ? WHERE id = ?', ['Done', id]);
    loadTasksFromDB(db);
  };

  const handleDeleteTask = (id) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this?',
      [
        { text: 'Cancel' },
        { text: 'OK', onPress: () => deleteTask(id) }
      ]
    );
  };

  const deleteTask = async (id) => {
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    loadTasksFromDB(db);
  };

  const renderTask = ({ item }) => {
    const dueDate = new Date(item.dueDate);  // Convert to Date object
    return (
      <View style={styles.taskItem}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskDescription}>{item.description}</Text>
        <Text style={styles.taskDueDate}>Due: {dueDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</Text>
        <Text style={styles.taskDueDate}>Time: {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text style={styles.taskDueDate}>Interval: {item.interval}</Text>
        <Text style={styles.taskStatus}>Status: {item.status}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity style={styles.button} onPress={() => handleEditTask(item.id)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => markTaskAsDone(item.id)}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleDeleteTask(item.id)}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
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
        onPress={() => {
          setNewTask({ title: '', description: '', dueDate: new Date(), recurring: false, interval: '' });
          setEditingTaskId(null);
          setModalVisible(true);
        }}
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
              <Picker.Item label="Daily" value="Daily" />
              <Picker.Item label="Weekly" value="Weekly" />
              <Picker.Item label="Fortnightly" value="Fortnightly" />
              <Picker.Item label="Monthly" value="Monthly" />
              <Picker.Item label="Yearly" value="Yearly" />
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
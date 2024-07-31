import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity,Text, View, TextInput, Button } from 'react-native';
import * as Notifications from 'expo-notifications';

// Example task data structure
const initialTasks = [
  { id: '1', title: 'Task 1', description: 'Description 1', dueDate: new Date(), recurring: false, status: 'pending' },
  { id: '2', title: 'Task 2', description: 'Description 2', dueDate: new Date(), recurring: true, interval: 'daily', status: 'pending' }
];

export default function TabOneScreen() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: new Date(), recurring: false, interval: '' });

  useEffect(() => {
    const scheduleNotifications = async () => {
      await Notifications.requestPermissionsAsync();
      tasks.forEach(task => {
        if (task.recurring) {
          Notifications.scheduleNotificationAsync({
            content: { title: 'Recurring Task Reminder', body: `${task.title} is due!` },
            trigger: { hour: 9, minute: 0, repeats: true }
          });
        }
      });
    };
    scheduleNotifications();
  }, [tasks]);

  const addTask = () => {
  const id = (tasks.length + 1).toString();
  const updatedTask = { ...newTask, id, status: 'pending' };
  setTasks(prevTasks => [...prevTasks, updatedTask]);
  setNewTask({ title: '', description: '', dueDate: new Date(), recurring: false, interval: '' });
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskDueDate}>Due: {item.dueDate.toDateString()}</Text>
      <Text style={styles.taskStatus}>Status: {item.status}</Text>
      {item.recurring && <Text style={styles.taskRecurring}>Recurring: {item.interval}</Text>}
      <TouchableOpacity style={styles.button} onPress={() => markTaskAsDone(item.id)}>
        <Text style={styles.buttonText}>Mark as Done</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => deleteTask(item.id)}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const markTaskAsDone = (id) => {
    const updatedTasks = tasks.map(task => (task.id === id ? { ...task, status: 'done' } : task));
    setTasks(updatedTasks);
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Manager</Text>
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
      <Button title="Add Task" onPress={addTask} />
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.taskList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  taskList: {
    marginTop: 20,
    width: '100%',
  },
  taskItem: {
    padding: 15,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 16,
  },
  taskDueDate: {
    fontSize: 14,
    color: 'gray',
  },
  taskStatus: {
    fontSize: 14,
    color: 'blue',
  },
  taskRecurring: {
    fontSize: 14,
    color: 'green',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import styles from "./app_components/styles";
import * as SQLite from "expo-sqlite";
import CalendarView from "./app_components/CalendarView";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import CompletedTasksScreen from "./app_components/CompletedTasksScreen";
import SettingsScreen from "./app_components/SettingsScreen";
import { ThemeProvider, useTheme } from "./app_components/ThemeContext";
import * as DocumentPicker from "expo-document-picker";
import TaskHistoryView from "./app_components/TaskHistoryView";

const Drawer = createDrawerNavigator();

function MainScreen() {
  const { theme } = useTheme();
  const [db, setDb] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: new Date(),
    recurring: false,
    interval: "",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [view, setView] = useState("list");
  const [visibleOptionsTaskId, setVisibleOptionsTaskId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showNextSevenDays, setShowNextSevenDays] = useState(false);

  useEffect(() => {
    initializeDatabase();
    scheduleNotifications();
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
      checkOverdueTasks();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const initializeDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync("tasks.db");
      setDb(database);

      await database.execAsync(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        dueDate TEXT,
        recurring INTEGER,
        interval TEXT,
        status TEXT,
        attachments TEXT
      );`);

      // Update the history table schema
      await database.execAsync(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER,
        oldStatus TEXT,
        newStatus TEXT,
        changeDate TEXT,
        changeType TEXT,
        FOREIGN KEY(taskId) REFERENCES tasks(id)
      );`);

      loadTasksFromDB(database);
    } catch (error) {
      console.log("Error initializing database:", error);
    }
  };

  const scheduleNotifications = async () => {
    await Notifications.requestPermissionsAsync();
    tasks.forEach((task) => {
      if (task.recurring) {
        let triggerConfig = {};
        if (task.interval === "daily") {
          triggerConfig = { hour: 9, minute: 0, repeats: true };
        } else if (task.interval === "weekly") {
          triggerConfig = {
            weekday: new Date().getDay(),
            hour: 9,
            minute: 0,
            repeats: true,
            interval: 7,
          };
        } else if (task.interval === "fortnightly") {
          triggerConfig = {
            weekday: new Date().getDay(),
            hour: 9,
            minute: 0,
            repeats: true,
            interval: 14,
          };
        } else if (task.interval === "monthly") {
          triggerConfig = {
            day: new Date().getDate(),
            hour: 9,
            minute: 0,
            repeats: true,
            interval: 30,
          };
        } else if (task.interval === "yearly") {
          triggerConfig = {
            day: new Date().getDate(),
            month: new Date().getMonth(),
            hour: 9,
            minute: 0,
            repeats: true,
            interval: 365,
          };
        }
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Recurring Reminder",
            body: `${task.title} is due!`,
          },
          trigger: triggerConfig,
        });
      }
    });
  };

  const loadTasksFromDB = async (database) => {
    try {
      const result = await database.getAllAsync(
        "SELECT * FROM tasks ORDER BY dueDate ASC"
      );
      const formattedTasks = result.map((task) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        recurring: task.recurring === 1,
        attachments: JSON.parse(task.attachments || "[]"),
      }));
      setTasks(formattedTasks);
      console.log("Tasks loaded:", formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const handleSaveTask = async () => {
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate.toISOString(),
        recurring: newTask.recurring ? 1 : 0,
        interval: newTask.interval || "",
        status: "Pending",
        attachments: JSON.stringify(attachments),
      };

      let result;
      if (editingTaskId !== null) {
        result = await db.runAsync(
          "UPDATE tasks SET title = ?, description = ?, dueDate = ?, recurring = ?, interval = ?, status = ?, attachments = ? WHERE id = ?",
          [...Object.values(taskData), editingTaskId]
        );
        await addToHistory(editingTaskId, "Edited");
        console.log("Task updated:", result);
      } else {
        result = await db.runAsync(
          "INSERT INTO tasks (title, description, dueDate, recurring, interval, status, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)",
          Object.values(taskData)
        );
        await addToHistory(result.insertId, "Created");
        console.log("Task created:", result);
      }

      await loadTasksFromDB(db);
      setNewTask({
        title: "",
        description: "",
        dueDate: new Date(),
        recurring: false,
        interval: "",
      });
      setAttachments([]);
      setModalVisible(false);
      scheduleNotification(taskData);
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task. Please try again.");
    }
  };

  const addToHistory = async (taskId, changeType) => {
    try {
      await db.runAsync(
        "INSERT INTO history (taskId, oldStatus, newStatus, changeDate, changeType) VALUES (?, ?, ?, ?, ?)",
        [taskId, "N/A", "N/A", new Date().toISOString(), changeType]
      );
      console.log("History added for task:", taskId, changeType);
    } catch (error) {
      console.error("Error adding to history:", error);
    }
  };

  const scheduleNotification = (task) => {
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `${task.title} is due soon!`,
      },
      trigger: { date: new Date(task.dueDate) },
    });
  };

  // Update checkOverdueTasks function
  const checkOverdueTasks = () => {
    const now = new Date();
    tasks.forEach((task) => {
      if (new Date(task.dueDate) < now && task.status === "Pending") {
        updateTaskStatus(task.id, "Overdue");
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Task Overdue",
            body: `${task.title} is overdue!`,
          },
          trigger: null,
        });
      }
    });
  };

  const handleTaskPress = (task) => {
    // Implement the logic for handling task press in calendar view
    console.log("Task pressed:", task);
    // You might want to open a modal or navigate to a task details screen
  };

  const handleEditTask = async (id) => {
    try {
      const result = await db.getFirstAsync(
        "SELECT * FROM tasks WHERE id = ?",
        [id]
      );
      if (result) {
        setNewTask({
          title: result.title,
          description: result.description,
          dueDate: new Date(result.dueDate),
          recurring: result.recurring === 1,
          interval: result.interval,
        });
        setEditingTaskId(id);
        setModalVisible(true);
      } else {
        console.log("Task not found");
      }
    } catch (error) {
      console.log("Error fetching task:", error);
    }
  };

  const updateTaskStatus = async (id, newStatus) => {
    try {
      const oldStatusResult = await db.getFirstAsync(
        "SELECT status FROM tasks WHERE id = ?",
        [id]
      );
      const oldStatus = oldStatusResult.status;
      await db.runAsync("UPDATE tasks SET status = ? WHERE id = ?", [
        newStatus,
        id,
      ]);
      await db.runAsync(
        "INSERT INTO history (taskId, oldStatus, newStatus, changeDate, changeType) VALUES (?, ?, ?, ?, ?)",
        [id, oldStatus, newStatus, new Date().toISOString(), "StatusChange"]
      );
      loadTasksFromDB(db);
    } catch (error) {
      console.log("Error updating task status:", error);
    }
  };

  const archiveTask = async (id) => {
    await updateTaskStatus(id, "Archived");
  };

  const markTaskAsDone = async (id) => {
    await updateTaskStatus(id, "Done");
  };

  const cancelTask = async (id) => {
    await updateTaskStatus(id, "Cancelled");
  };

  const loadTaskHistory = async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT h.*, t.title 
        FROM history h 
        JOIN tasks t ON h.taskId = t.id 
        ORDER BY h.changeDate DESC
      `);
      return result;
    } catch (error) {
      console.log("Error loading task history:", error);
      return [];
    }
  };

  // Add a new component to display task history
  const TaskHistoryView = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
      const fetchHistory = async () => {
        const historyData = await loadTaskHistory();
        setHistory(historyData);
      };
      fetchHistory();
    }, []);

    const renderHistoryItem = ({ item }) => (
      <View style={styles.historyItem}>
        <Text style={styles.historyTitle}>{item.title}</Text>
        <Text>
          Status changed from {item.oldStatus} to {item.newStatus}
        </Text>
        <Text>Date: {new Date(item.changeDate).toLocaleString()}</Text>
      </View>
    );
    return (
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
      />
    );
  };

  const handleDeleteTask = (id) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this?", [
      { text: "Cancel" },
      { text: "OK", onPress: () => deleteTask(id) },
    ]);
  };

  const deleteTask = async (id) => {
    await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
    await addToHistory(id, "Deleted");
    loadTasksFromDB(db);
  };

  const handleAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync();
      if (result.type === "success") {
        setAttachments([...attachments, result]);
      }
    } catch (error) {
      console.log("Error picking document:", error);
    }
  };

  const formatDate = (date) => {
    return date instanceof Date
      ? date.toISOString().split("T")[0]
      : new Date(date).toISOString().split("T")[0];
  };

  // Update this function
  const handleDateSelect = (date) => {
    const tasksForDate = tasks.filter(
      (task) => formatDate(task.dueDate) === date
    );
    console.log("Tasks for selected date:", tasksForDate);
    // You can implement further logic here, like showing these tasks in a modal
  };

  const renderTask = ({ item }) => {
    const isOverdue =
      new Date(item.dueDate) < new Date() && item.status === "Pending";
    return (
      <TouchableOpacity
        style={[styles.taskItem, isOverdue && styles.overdueTask]}
        onPress={() => setVisibleOptionsTaskId(item.id)}
      >
        <Text style={[styles.taskTitle, isOverdue && styles.overdueText]}>
          {item.title}
        </Text>
        {visibleOptionsTaskId === item.id && (
          <View>
            <Text style={styles.taskDescription}>{item.description}</Text>
            <Text style={styles.taskDueDate}>
              Due: {new Date(item.dueDate).toLocaleString()}
            </Text>
            <Text style={styles.taskStatus}>Status: {item.status}</Text>
            <Text style={styles.taskInterval}>Interval: {item.interval}</Text>
            {item.attachments.length > 0 && (
              <Text style={styles.taskAttachments}>
                Attachments: {item.attachments.length}
              </Text>
            )}
            <View style={styles.taskOptions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleEditTask(item.id)}
              >
                <Image
                  source={require("./assets/Pencil.png")}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => markTaskAsDone(item.id)}
              >
                <Image
                  source={require("./assets/mark-as-done.png")}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => archiveTask(item.id)}
              >
                <Image
                  source={require("./assets/archive.png")}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDeleteTask(item.id)}
              >
                <Image
                  source={require("./assets/delete.png")}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Update getTasksToShow function
  const getTasksToShow = () => {
    const now = new Date();
    let filteredTasks = tasks.filter(
      (task) => task.status !== "Done" && task.status !== "Archived"
    );
    if (showNextSevenDays) {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filteredTasks = filteredTasks.filter(
        (task) => new Date(task.dueDate) <= sevenDaysLater
      );
    } else {
      filteredTasks = filteredTasks.filter(
        (task) => new Date(task.dueDate).toDateString() === now.toDateString()
      );
    }
    return filteredTasks.sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );
  };

  const formatDateTime = (date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, { color: theme.text }]}>
          Event Manager
        </Text>
        <Text style={styles.currentDateTime}>
          Today's Date: {formatDateTime(currentDateTime)}
        </Text>
      </View>
      <View style={styles.list_calendar}>
        <TouchableOpacity onPress={() => setView("list")}>
          <Text>List View</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("calendar")}>
          <Text>Calendar View</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("history")}>
          <Text>History</Text>
        </TouchableOpacity>
      </View>

      {view === "list" && (
        <>
          <View style={styles.viewToggle}>
            <TouchableOpacity onPress={() => setShowNextSevenDays(false)}>
              <Text
                style={
                  showNextSevenDays
                    ? styles.inactiveToggle
                    : styles.activeToggle
                }
              >
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowNextSevenDays(true)}>
              <Text
                style={
                  showNextSevenDays
                    ? styles.activeToggle
                    : styles.inactiveToggle
                }
              >
                Next 7 Days
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={getTasksToShow()}
            renderItem={renderTask}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.taskList}
          />
        </>
      )}

      {view === "calendar" && (
        <CalendarView
          tasks={tasks}
          onSelectDate={handleDateSelect}
          onTaskPress={handleTaskPress}
        />
      )}

      {view === "history" && <TaskHistoryView db={db} />}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setNewTask({
            title: "",
            description: "",
            dueDate: new Date(),
            recurring: false,
            interval: "",
          });
          setEditingTaskId(null);
          setModalVisible(true);
        }}
      >
        <Image
          source={require("./icons8-add-button-96.png")}
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.modalView}>
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Task Description"
              value={newTask.description}
              onChangeText={(text) =>
                setNewTask({ ...newTask, description: text })
              }
            />
            <Picker
              selectedValue={newTask.interval}
              style={styles.picker}
              onValueChange={(itemValue) =>
                setNewTask({ ...newTask, interval: itemValue })
              }
            >
              <Picker.Item label="Select Interval" value="" />
              <Picker.Item label="Daily" value="Daily" />
              <Picker.Item label="Weekly" value="Weekly" />
              <Picker.Item label="Fortnightly" value="Fortnightly" />
              <Picker.Item label="Monthly" value="Monthly" />
              <Picker.Item label="Yearly" value="Yearly" />
            </Picker>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.buttonText}>Select Due Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setShowTimePicker(true)}
            >
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
                  setNewTask({ ...newTask, dueDate: new Date(currentDate) });
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
                  setNewTask({ ...newTask, dueDate: currentTime });
                }}
              />
            )}
            <TouchableOpacity
              style={styles.customButton}
              onPress={handleAttachment}
            >
              <Text style={styles.buttonText}>Add Attachment</Text>
            </TouchableOpacity>
            <Text>
              Selected Date and Time: {formatDateTime(newTask.dueDate)}
            </Text>
            <TouchableOpacity
              style={styles.customButton}
              onPress={handleSaveTask}
            >
              <Text style={styles.buttonText}>
                {editingTaskId ? "Update Task" : "Add Task"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

// The structure of the app is defined using the NavigationContainer and DrawerNavigator components
export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Drawer.Navigator initialRouteName="Main">
          <Drawer.Screen name="Main" component={MainScreen} />
          <Drawer.Screen
            name="Completed Tasks"
            component={CompletedTasksScreen}
          />
          <Drawer.Screen name="History" component={TaskHistoryView} />
          <Drawer.Screen name="Settings" component={SettingsScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

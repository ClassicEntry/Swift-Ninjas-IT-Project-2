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
  StyleSheet,
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
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
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
        status TEXT
      );`);

      await database.execAsync(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER,
        oldStatus TEXT,
        newStatus TEXT,
        changeDate TEXT,
        FOREIGN KEY(taskId) REFERENCES tasks(id)
      );`);

      loadTasksFromDB(database);
    } catch (error) {
      console.log("Error initializing database:", error);
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  useEffect(() => {
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
    scheduleNotifications();
  }, [tasks]);

  const loadTasksFromDB = async (database) => {
    try {
      const result = await database.getAllAsync("SELECT * FROM tasks");
      setTasks(sortTasksByDueDate(result));
    } catch (error) {
      console.log("Error loading tasks:", error);
    }
  };

  // Function to schedule a notification for a task
  const scheduleTaskNotification = async (task) => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const notificationTime = new Date(dueDate.getTime() - 30 * 60000); // 30 minutes before due time

    // If the notification time is in the past, don't schedule it
    if (notificationTime <= now) {
      console.log(`Skipping notification for overdue task: ${task.title}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Task Due Soon",
          body: `Your task "${task.title}" is due in 30 minutes!`,
        },
        trigger: notificationTime,
      });
      console.log(`Notification scheduled for task: ${task.title}`);
    } catch (error) {
      console.error("Failed to schedule notification:", error);
    }
  };

  // Function to check for overdue tasks and send notifications
  const checkOverdueTasks = async () => {
    const now = new Date();
    const overdueTasks = tasks.filter(
      (task) => new Date(task.dueDate) < now && task.status !== "Done"
    );

    for (let task of overdueTasks) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Overdue Task",
            body: `Your task "${task.title}" is overdue!`,
          },
          trigger: null, // Send immediately
        });
        console.log(
          `Immediate notification sent for overdue task: ${task.title}`
        );
      } catch (error) {
        console.error("Failed to send immediate notification:", error);
      }
    }
  };

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("You need to enable notifications to use this feature.");
      }
    };

    requestPermissions();

    // Schedule notifications for existing tasks
    tasks.forEach(scheduleTaskNotification);

    // Calculate the initial delay until 9 AM the next day
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    if (now >= next9AM) {
      next9AM.setDate(next9AM.getDate() + 1);
    }
    const initialDelay = next9AM - now;

    // Set a timeout to check for overdue tasks at 9 AM the next day
    const timeoutId = setTimeout(() => {
      checkOverdueTasks();
      // Set an interval to check for overdue tasks every 24 hours
      const overdueCheckInterval = setInterval(checkOverdueTasks, 86400000); // Check every 24 hours
      return () => clearInterval(overdueCheckInterval);
    }, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [tasks]);

  const handleSaveTask = async () => {
    try {
      if (editingTaskId !== null) {
        // Editing an existing task
        await db.runAsync(
          "UPDATE tasks SET title = ?, description = ?, dueDate = ?, recurring = ?, interval = ?, status = ? WHERE id = ?",
          [
            newTask.title,
            newTask.description,
            newTask.dueDate.toISOString(),
            newTask.recurring ? 1 : 0,
            newTask.interval,
            "Pending",
            editingTaskId,
          ]
        );

        // Record the edit in history
        await db.runAsync(
          "INSERT INTO history (taskId, oldStatus, newStatus, changeDate) VALUES (?, ?, ?, ?)",
          [editingTaskId, "Edited", "Edited", new Date().toISOString()]
        );

        console.log(`Task updated with ID: ${editingTaskId}`);
      } else {
        // Creating a new task
        const result = await db.runAsync(
          "INSERT INTO tasks (title, description, dueDate, recurring, interval, status) VALUES (?, ?, ?, ?, ?, ?)",
          [
            newTask.title,
            newTask.description,
            newTask.dueDate.toISOString(),
            newTask.recurring ? 1 : 0,
            newTask.interval,
            "Pending",
          ]
        );

        // Record the creation in history
        await db.runAsync(
          "INSERT INTO history (taskId, oldStatus, newStatus, changeDate) VALUES (?, ?, ?, ?)",
          [result.insertId, "Created", "Pending", new Date().toISOString()]
        );

        console.log(`New task created with ID: ${result.insertId}`);
      }

      await loadTasksFromDB(db);
      setNewTask({
        title: "",
        description: "",
        dueDate: new Date(),
        recurring: false,
        interval: "",
      });
      setEditingTaskId(null); // Reset editingTaskId after saving
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task. Please try again.");
    }
  };

  const handleEditTask = async (id) => {
    if (!db) {
      console.error("Database not initialized");
      Alert.alert("Error", "Database not ready. Please try again later.");
      return;
    }

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
        Alert.alert("Error", "Task not found.");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      Alert.alert("Error", "Failed to load task details. Please try again.");
    }
  };

  const updateTaskStatus = async (id, newStatus) => {
    try {
      const oldStatus = await db.getFirstAsync(
        "SELECT status FROM tasks WHERE id = ?",
        [id]
      );
      await db.runAsync("UPDATE tasks SET status = ? WHERE id = ?", [
        newStatus,
        id,
      ]);
      await db.runAsync(
        "INSERT INTO history (taskId, oldStatus, newStatus, changeDate) VALUES (?, ?, ?, ?)",
        [id, oldStatus.status, newStatus, new Date().toISOString()]
      );
      loadTasksFromDB(db);
    } catch (error) {
      console.log("Error updating task status:", error);
    }
  };

  const sortTasksByDueDate = (tasks) => {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA - dateB;
    });
  };

  const markTaskAsDone = async (id) => {
    await updateTaskStatus(id, "Done");
  };

  const cancelTask = async (id) => {
    await updateTaskStatus(id, "Cancelled");
  };

  // Function to load task history
  const loadTaskHistory = async () => {
    try {
      const result = await db.getAllAsync(`
      SELECT h.*, t.title, t.description, 
             CASE 
               WHEN t.id IS NULL THEN 'Deleted'
               ELSE t.status
             END AS current_status
      FROM history h 
      LEFT JOIN tasks t ON h.taskId = t.id 
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
        <Text style={styles.historyDescription}>{item.description}</Text>
        <Text style={styles.historyStatus}>
          Status changed from {item.oldStatus} to {item.newStatus}
        </Text>
        <Text style={styles.historyDate}>
          Date: {new Date(item.changeDate).toLocaleString()}
        </Text>
        <Text style={styles.currentStatus}>
          Current Status: {item.current_status}
        </Text>
      </View>
    );

    return (
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.historyList}
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
    try {
      const oldStatus = await db.getFirstAsync(
        "SELECT status FROM tasks WHERE id = ?",
        [id]
      );
      await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
      await db.runAsync(
        "INSERT INTO history (taskId, oldStatus, newStatus, changeDate) VALUES (?, ?, ?, ?)",
        [id, oldStatus.status, "Deleted", new Date().toISOString()]
      );
      loadTasksFromDB(db);
    } catch (error) {
      console.log("Error deleting task:", error);
    }
  };

  const handleDateSelect = (date) => {
    const tasksForDate = tasks.filter((task) => task.dueDate.startsWith(date));
  };

  const renderTask = ({ item }) => {
    const dueDate = new Date(item.dueDate);
    const isExpanded = expandedTasks[item.id];
    const isOverdue = dueDate < new Date() && item.status !== "Done";

    const toggleExpand = () => {
      setExpandedTasks((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    };

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          isExpanded && styles.taskItemExpanded,
          isOverdue && styles.overdueTask,
        ]}
        onPress={toggleExpand}
      >
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, isOverdue && styles.overdueText]}>
            {item.title}
            {isOverdue && " (OVERDUE)"}
          </Text>
        </View>
        {isExpanded && (
          <View style={styles.taskDetails}>
            <Text style={styles.taskDescription}>{item.description}</Text>
            <Text style={styles.taskDueDate}>
              Due:{" "}
              {dueDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.taskDueDate}>
              Time:{" "}
              {dueDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <Text style={styles.taskDueDate}>Interval: {item.interval}</Text>
            <Text style={styles.taskStatus}>Status: {item.status}</Text>
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
                onPress={() => cancelTask(item.id)}
              >
                <Image
                  source={require("./assets/x.png")}
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
      </View>
      {view === "list" ? (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.taskList}
          style={{ flex: 1 }}
        />
      ) : view === "calendar" ? (
        <CalendarView
          tasks={tasks}
          onUpdateTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={(date) => {
            setNewTask({
              ...newTask,
              dueDate: new Date(date),
            });
            setModalVisible(true);
          }}
        />
      ) : (
        <TaskHistoryView />
      )}
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
          setEditingTaskId(null); // Reset editingTaskId when adding a new task
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
                  setNewTask({
                    ...newTask,
                    dueDate: new Date(
                      currentDate.setHours(
                        newTask.dueDate.getHours(),
                        newTask.dueDate.getMinutes()
                      )
                    ),
                  });
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
                  setNewTask({
                    ...newTask,
                    dueDate: new Date(
                      newTask.dueDate.setHours(
                        currentTime.getHours(),
                        currentTime.getMinutes()
                      )
                    ),
                  });
                }}
              />
            )}
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

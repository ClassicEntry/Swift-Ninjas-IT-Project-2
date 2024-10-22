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
  Switch,
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
import ArchivedTasksScreen from "./app_components/ArchivedTasksScreen";

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

  const AlertAsync = async (title, message, buttons) => {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        buttons.map((button) => ({
          ...button,
          onPress: () => resolve(button.value),
        }))
      );
    });
  };

  const initializeDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync("tasks.db");
      setDb(database);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT,
          dueDate TEXT,
          recurring INTEGER,
          interval TEXT,
          status TEXT,
          parentTaskId INTEGER, -- Add this field for recurring task relationship
          FOREIGN KEY(parentTaskId) REFERENCES tasks(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          taskId INTEGER,
          oldStatus TEXT,
          newStatus TEXT,
          changeDate TEXT,
          FOREIGN KEY(taskId) REFERENCES tasks(id)
        );
      `);

      loadTasksFromDB(database);
    } catch (error) {
      console.log("Error initializing database:", error);
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  // Set up notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Function to generate unique notification ID
  const getNotificationId = (task, type) => {
    return `${task.id}-${type}`;
  };

  // Function to schedule notifications for a task
  const scheduleTaskNotification = async (task) => {
    try {
      // Cancel existing notifications
      const notificationIds = [
        getNotificationId(task, "due"),
        getNotificationId(task, "warning"),
        getNotificationId(task, "recurring"),
      ];

      for (const id of notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }

      if (task.status === "Done") return;

      const now = new Date();
      const dueDate = new Date(task.dueDate);

      // For recurring tasks
      if (task.recurring && task.interval) {
        const time = new Date(task.dueDate);
        const interval = task.interval.toLowerCase();
        console.log(
          "Scheduling recurring notification for interval:",
          interval
        );

        let trigger;
        switch (interval) {
          case "daily":
            // For daily tasks, use a DateTimeComponent trigger
            trigger = {
              hour: time.getHours(),
              minute: time.getMinutes(),
              second: 0,
              repeats: true,
            };
            break;

          case "weekly":
            // For weekly tasks
            trigger = {
              hour: time.getHours(),
              minute: time.getMinutes(),
              second: 0,
              weekday: time.getDay() + 1, // 1-7, where 1 is Monday
              repeats: true,
            };
            break;

          case "fortnightly":
            // For fortnightly tasks, schedule the next occurrence
            const nextDate = calculateNextOccurrence(dueDate, interval);
            trigger = nextDate; // Direct date object for one-time trigger
            break;

          case "monthly":
            // For monthly tasks
            trigger = {
              hour: time.getHours(),
              minute: time.getMinutes(),
              second: 0,
              day: time.getDate(), // Day of the month (1-31)
              repeats: true,
            };
            break;

          case "yearly":
            // For yearly tasks
            trigger = {
              hour: time.getHours(),
              minute: time.getMinutes(),
              second: 0,
              day: time.getDate(),
              month: time.getMonth() + 1, // 1-12
              repeats: true,
            };
            break;
        }

        // Schedule the recurring notification
        await Notifications.scheduleNotificationAsync({
          identifier: getNotificationId(task, "recurring"),
          content: {
            title: `${task.interval} Task Due`,
            body: `"${task.title}" is due!`,
            data: { taskId: task.id },
          },
          trigger: trigger,
        });

        // Add 30-minute warning if task is in the future
        if (dueDate > now) {
          const warningTime = new Date(dueDate);
          warningTime.setMinutes(warningTime.getMinutes() - 30);

          if (warningTime > now) {
            await Notifications.scheduleNotificationAsync({
              identifier: getNotificationId(task, "warning"),
              content: {
                title: "Task Due Soon",
                body: `"${task.title}" is due in 30 minutes!`,
                data: { taskId: task.id },
              },
              trigger: warningTime,
            });
          }
        }
      }
      // For non-recurring tasks
      else {
        if (dueDate > now) {
          // Schedule main notification at due time
          await Notifications.scheduleNotificationAsync({
            identifier: getNotificationId(task, "due"),
            content: {
              title: "Task Due",
              body: `"${task.title}" is now due!`,
              data: { taskId: task.id },
            },
            trigger: dueDate,
          });

          // Schedule 30-minute warning
          const warningTime = new Date(dueDate);
          warningTime.setMinutes(warningTime.getMinutes() - 30);

          if (warningTime > now) {
            await Notifications.scheduleNotificationAsync({
              identifier: getNotificationId(task, "warning"),
              content: {
                title: "Task Due Soon",
                body: `"${task.title}" is due in 30 minutes!`,
                data: { taskId: task.id },
              },
              trigger: warningTime,
            });
          }
        }
        // For overdue tasks
        else if (task.status !== "Done") {
          await Notifications.scheduleNotificationAsync({
            identifier: getNotificationId(task, "reminder"),
            content: {
              title: "Overdue Task",
              body: `"${task.title}" is overdue!`,
              data: { taskId: task.id },
            },
            trigger: {
              hour: 9,
              minute: 0,
              second: 0,
              repeats: true,
            },
          });
        }
      }

      // Debug logging
      console.log(`Scheduled notifications for task: ${task.title}`);
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      console.error("Error details:", error.message);
    }
  };

  // Add a notification monitoring effect
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Received notification:", notification);
      }
    );

    // Also monitor notification responses (when user taps notification)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Add a function to verify scheduled notifications (helpful for debugging)
  const verifyScheduledNotifications = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log("Currently scheduled notifications:", scheduled);
    } catch (error) {
      console.error("Error checking scheduled notifications:", error);
    }
  };

  // Main useEffect to handle notifications
  useEffect(() => {
    const setupNotifications = async () => {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("You need to enable notifications to use this feature.");
        return;
      }

      // Schedule notifications for all tasks
      for (const task of tasks) {
        await scheduleTaskNotification(task);
      }
    };

    setupNotifications();
  }, [tasks]); // Re-run when tasks change
  // Function to calculate next occurrence
  const calculateNextOccurrence = (currentDate, interval) => {
    const nextDate = new Date(currentDate);

    switch (interval.toLowerCase()) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "fortnightly":
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        return null;
    }
    return nextDate;
  };

  // Function to handle recurring task completion
  const handleRecurringTaskComplete = async (task) => {
    try {
      // Create next occurrence
      const nextDueDate = calculateNextOccurrence(task.dueDate, task.interval);

      // Insert next occurrence
      const result = await db.runAsync(
        `INSERT INTO tasks (title, description, dueDate, recurring, interval, status, parentTaskId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          task.title,
          task.description,
          nextDueDate.toISOString(),
          1,
          task.interval,
          "Pending",
          task.parentTaskId || task.id, // Link to original task
        ]
      );

      // Update history
      await db.runAsync(
        `INSERT INTO history (taskId, oldStatus, newStatus, changeDate) 
       VALUES (?, ?, ?, ?)`,
        [result.insertId, "Created", "Pending", new Date().toISOString()]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error creating next occurrence:", error);
      throw error;
    }
  };
  // Function to handle task completion
  const handleTaskComplete = async (taskId) => {
    // Cancel all notifications for this task
    const notificationIds = [
      getNotificationId({ id: taskId }, "due"),
      getNotificationId({ id: taskId }, "warning"),
      getNotificationId({ id: taskId }, "reminder"),
      getNotificationId({ id: taskId }, "recurring"),
    ];

    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  };

  const loadTasksFromDB = async (database) => {
    try {
      const result = await database.getAllAsync(
        `SELECT * FROM tasks 
         WHERE status != 'Done' 
         AND status != 'Completed' 
         AND status != 'Archived' 
         ORDER BY dueDate ASC`
      );
      setTasks(sortTasksByDueDate(result));
    } catch (error) {
      console.log("Error loading tasks:", error);
    }
  };

  const handleSaveTask = async () => {
    try {
      // Validate required fields
      if (!newTask.title) {
        Alert.alert("Error", "Task title is required");
        return;
      }

      // For recurring tasks, verify interval is selected
      if (newTask.recurring && !newTask.interval) {
        Alert.alert("Error", "Please select a recurring interval");
        return;
      }

      if (editingTaskId !== null) {
        // Editing an existing task
        const existingTask = await db.getFirstAsync(
          "SELECT * FROM tasks WHERE id = ?",
          [editingTaskId]
        );

        if (!existingTask) {
          Alert.alert("Error", "Task not found");
          return;
        }

        if (existingTask.recurring) {
          const choice = await AlertAsync(
            "Edit Recurring Task",
            "Would you like to edit just this occurrence or all future occurrences?",
            [
              { text: "Just This One", value: "single" },
              { text: "All Future", value: "future" },
              { text: "Cancel", value: "cancel" },
            ]
          );

          if (choice === "cancel") {
            return;
          }

          if (choice === "future") {
            // Update all future occurrences
            await db.runAsync(
              `UPDATE tasks 
               SET title = ?, 
                   description = ?, 
                   interval = ?,
                   recurring = ?
               WHERE (id = ? OR parentTaskId = ?) 
               AND datetime(dueDate) >= datetime(?)`,
              [
                newTask.title,
                newTask.description,
                newTask.interval,
                newTask.recurring ? 1 : 0,
                existingTask.parentTaskId || existingTask.id,
                existingTask.parentTaskId || existingTask.id,
                existingTask.dueDate,
              ]
            );

            // Update due dates for all future occurrences to maintain the new interval
            const futureTasks = await db.getAllAsync(
              `SELECT * FROM tasks 
               WHERE (id = ? OR parentTaskId = ?) 
               AND datetime(dueDate) >= datetime(?)
               ORDER BY dueDate`,
              [
                existingTask.parentTaskId || existingTask.id,
                existingTask.parentTaskId || existingTask.id,
                existingTask.dueDate,
              ]
            );

            let baseDate = new Date(newTask.dueDate);
            for (const task of futureTasks) {
              await db.runAsync(`UPDATE tasks SET dueDate = ? WHERE id = ?`, [
                baseDate.toISOString(),
                task.id,
              ]);
              baseDate = calculateNextOccurrence(baseDate, newTask.interval);
            }
          } else {
            // Update just this occurrence
            await db.runAsync(
              `UPDATE tasks 
               SET title = ?, 
                   description = ?, 
                   dueDate = ?,
                   recurring = ?,
                   interval = ?,
                   parentTaskId = NULL
               WHERE id = ?`,
              [
                newTask.title,
                newTask.description,
                newTask.dueDate.toISOString(),
                0, // Make it non-recurring
                null,
                editingTaskId,
              ]
            );
          }
        } else {
          // Regular update for non-recurring tasks
          await db.runAsync(
            `UPDATE tasks 
             SET title = ?, 
                 description = ?, 
                 dueDate = ?, 
                 recurring = ?, 
                 interval = ?
             WHERE id = ?`,
            [
              newTask.title,
              newTask.description,
              newTask.dueDate.toISOString(),
              newTask.recurring ? 1 : 0,
              newTask.interval,
              editingTaskId,
            ]
          );
        }

        // Record the edit in history
        await db.runAsync(
          "INSERT INTO history (taskId, oldStatus, newStatus, changeDate) VALUES (?, ?, ?, ?)",
          [editingTaskId, "Edited", "Edited", new Date().toISOString()]
        );
      } else {
        // Creating a new task
        const result = await db.runAsync(
          `INSERT INTO tasks (
            title, 
            description, 
            dueDate, 
            recurring, 
            interval, 
            status,
            parentTaskId
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            newTask.title,
            newTask.description,
            newTask.dueDate.toISOString(),
            newTask.recurring ? 1 : 0,
            newTask.interval,
            "Pending",
            null, // This will be the parent task for future recurring instances
          ]
        );

        // If it's a recurring task, set its own ID as parentTaskId
        if (newTask.recurring) {
          await db.runAsync("UPDATE tasks SET parentTaskId = ? WHERE id = ?", [
            result.insertId,
            result.insertId,
          ]);
        }

        // Record the creation in history
        await db.runAsync(
          "INSERT INTO history (taskId, oldStatus, newStatus, changeDate) VALUES (?, ?, ?, ?)",
          [result.insertId, "Created", "Pending", new Date().toISOString()]
        );

        // Schedule notifications for the new task
        await scheduleTaskNotification({
          ...newTask,
          id: result.insertId,
          status: "Pending",
        });
      }

      // Reset form and close modal
      setNewTask({
        title: "",
        description: "",
        dueDate: new Date(),
        recurring: false,
        interval: "",
      });
      setEditingTaskId(null);
      setModalVisible(false);

      // Reload tasks
      await loadTasksFromDB(db);
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task. Please try again.");
    }
  };

  // Add this helper function for Task Form validation
  const validateTaskForm = (task) => {
    const errors = [];

    if (!task.title.trim()) {
      errors.push("Title is required");
    }

    if (task.recurring && !task.interval) {
      errors.push("Please select a recurring interval");
    }

    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join("\n"));
      return false;
    }

    return true;
  };

  // Update the handleEditTask function to load task data into the form
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
          interval: result.interval || "",
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
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return [...tasks]
      .filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate <= sevenDaysFromNow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA - dateB;
      });
  };

  const markTaskAsDone = async (id) => {
    await handleTaskComplete(id);
    await updateTaskStatus(id, "Done");
    try {
      const task = await db.getFirstAsync("SELECT * FROM tasks WHERE id = ?", [
        id,
      ]);
      if (!task) {
        Alert.alert("Error", "Task not found.");
        return;
      }

      // Mark current task as done
      await db.runAsync(`UPDATE tasks SET status = ? WHERE id = ?`, [
        "Done",
        id,
      ]);

      await db.runAsync(
        "INSERT INTO history (taskId, oldStatus, newStatus, changeDate) VALUES (?, ?, ?, ?)",
        [id, task.status, "Done", new Date().toISOString()]
      );

      // If recurring, create next occurrence
      if (task.recurring) {
        const newTaskId = await handleRecurringTaskComplete(task);
        if (newTaskId) {
          await scheduleTaskNotification({
            ...task,
            id: newTaskId,
            dueDate: calculateNextOccurrence(task.dueDate, task.interval),
            status: "Pending",
          });
        }
      }

      // Immediately refresh the tasks list
      await loadTasksFromDB(db);
    } catch (error) {
      console.error("Error marking task as done:", error);
      Alert.alert("Error", "Failed to complete task. Please try again.");
    }
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
      const task = await db.getFirstAsync("SELECT * FROM tasks WHERE id = ?", [
        id,
      ]);
      if (!task) {
        Alert.alert("Error", "Task not found.");
        return;
      }

      if (task.recurring) {
        const choice = await AlertAsync(
          "Delete Recurring Task",
          "Would you like to delete just this occurrence or all future occurrences?",
          [
            { text: "Just This One", value: "single" },
            { text: "All Future", value: "future" },
            { text: "Cancel", value: "cancel" },
          ]
        );

        if (choice === "cancel") return;

        if (choice === "future") {
          // Delete all future occurrences
          await db.runAsync(
            `DELETE FROM tasks 
             WHERE (id = ? OR parentTaskId = ?) 
             AND dueDate >= ?`,
            [
              task.parentTaskId || task.id,
              task.parentTaskId || task.id,
              task.dueDate,
            ]
          );
        } else {
          // Delete just this occurrence
          await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
        }
      } else {
        // Regular delete for non-recurring tasks
        await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
      }

      await loadTasksFromDB(db);
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task. Please try again.");
    }
  };

  const handleDateSelect = (date) => {
    const tasksForDate = tasks.filter((task) => task.dueDate.startsWith(date));
  };

  const archiveTask = async (id) => {
    await updateTaskStatus(id, "Archived");
    try {
      const task = await db.getFirstAsync("SELECT * FROM tasks WHERE id = ?", [
        id,
      ]);

      if (!task) {
        Alert.alert("Error", "Task not found.");
        return;
      }

      if (task.recurring) {
        const choice = await AlertAsync(
          "Archive Recurring Task",
          "Would you like to archive just this occurrence or all future occurrences?",
          [
            { text: "Just This One", value: "single" },
            { text: "All Future", value: "future" },
            { text: "Cancel", value: "cancel" },
          ]
        );

        if (choice === "cancel") return;

        if (choice === "future") {
          // Archive all future occurrences
          await db.runAsync(
            `UPDATE tasks 
             SET status = 'Archived' 
             WHERE (id = ? OR parentTaskId = ?) 
             AND dueDate >= ?`,
            [
              task.parentTaskId || task.id,
              task.parentTaskId || task.id,
              task.dueDate,
            ]
          );
        } else {
          // Archive just this occurrence
          await updateTaskStatus(id, "Archived");
        }
      } else {
        // Regular archive for non-recurring tasks
        await updateTaskStatus(id, "Archived");
      }

      await loadTasksFromDB(db);
    } catch (error) {
      console.error("Error archiving task:", error);
      Alert.alert("Error", "Failed to archive task. Please try again.");
    }
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
                onPress={() => archiveTask(item.id)} // Changed from cancelTask to archiveTask
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
        <Image
          source={require("./assets/NinjaLogo.png")} // Make sure the path is correct
          style={styles.ninjaLogo} // Define this style for proper positioning
        />
      </View>
      <View style={styles.list_calendar}>
        <TouchableOpacity onPress={() => setView("list")}>
          <Text>Upcoming tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("calendar")}>
          <Text>Calendar</Text>
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
            {/* <Text style={styles.modalTitle}>
              {editingTaskId ? "Update Task" : "Add Task"}
            </Text> */}
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              placeholderTextColor="#999" // Set placeholder text color to a lighter shade
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Task Description"
              placeholderTextColor="#999" // Set placeholder text color to a lighter shade
              value={newTask.description}
              onChangeText={(text) =>
                setNewTask({ ...newTask, description: text })
              }
            />

            {/* Add the Recurring Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Recurring Task</Text>
              <Switch
                value={newTask.recurring}
                onValueChange={(value) => {
                  setNewTask({
                    ...newTask,
                    recurring: value,
                    interval: value ? newTask.interval : "", // Clear interval if recurring is turned off
                  });
                }}
              />
            </View>

            {/* Show interval picker only if recurring is true */}
            {newTask.recurring && (
              <Picker
                selectedValue={newTask.interval}
                style={styles.picker}
                onValueChange={(itemValue) =>
                  setNewTask({ ...newTask, interval: itemValue.toLowerCase() })
                }
              >
                <Picker.Item label="Select Interval" value="" />
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Fortnightly" value="fortnightly" />
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Yearly" value="yearly" />
              </Picker>
            )}

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
          <Drawer.Screen
            name="Archived Tasks"
            component={ArchivedTasksScreen}
          />
          <Drawer.Screen name="History" component={TaskHistoryView} />
          <Drawer.Screen name="Settings" component={SettingsScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

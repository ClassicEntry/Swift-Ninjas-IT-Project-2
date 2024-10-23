import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image
} from "react-native";
import * as SQLite from "expo-sqlite";
import { useTheme } from "./ThemeContext";
import { useFocusEffect } from "@react-navigation/native";

/**
 * ArchivedTasksScreen component displays a list of archived tasks.
 * Users can expand tasks to see details and perform actions like restore or delete.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.navigation - The navigation object provided by React Navigation.
 * @returns {JSX.Element} The rendered ArchivedTasksScreen component.
 *
 * @example
 * return (
 *   <ArchivedTasksScreen navigation={navigation} />
 * )
 *
 * @function
 * @name ArchivedTasksScreen
 *
 * @description
 * This component:
 * - Initializes the SQLite database.
 * - Loads archived tasks from the database.
 * - Displays archived tasks in a list format.
 * - Allows users to expand tasks to see details.
 * - Provides actions to restore or delete tasks.
 *
 * @requires useState - React hook to manage component state.
 * @requires useEffect - React hook to perform side effects in the component.
 * @requires SQLite - Module to interact with SQLite database.
 * @requires useTheme - Custom hook to access the current theme.
 * @requires useFocusEffect - React Navigation hook to handle screen focus events.
 * @requires View - React Native component for rendering views.
 * @requires Text - React Native component for rendering text.
 * @requires FlatList - React Native component for rendering lists.
 * @requires TouchableOpacity - React Native component for touchable elements.
 * @requires StyleSheet - React Native module for creating styles.
 * @requires Image - React Native component for rendering images.
 */
function ArchivedTasksScreen({ navigation }) {
  const [db, setDb] = useState(null);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState({});
  const { theme } = useTheme();

  // Initial database setup
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync("tasks.db");
        setDb(database);
        await loadArchivedTasksFromDB(database);
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };

    initializeDatabase();
  }, []);

  // Auto refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (db) {
        loadArchivedTasksFromDB(db);
      }
      return () => {};
    }, [db])
  );

  /**
   * Loads archived tasks from the database.
   *
   * @param {Object} database - The SQLite database instance.
   */
  const loadArchivedTasksFromDB = async (database) => {
    try {
      const result = await database.getAllAsync(
        `SELECT * FROM tasks 
         WHERE status = 'Archived' 
         ORDER BY dueDate DESC`
      );
      setArchivedTasks(result);
      console.log("Loaded archived tasks:", result.length); // Debug log
    } catch (error) {
      console.error("Error loading archived tasks:", error);
    }
  };

  /**
   * Toggles the expanded state of a task.
   *
   * @param {number} taskId - The ID of the task to toggle.
   */
  const toggleExpand = (taskId) => {
    setExpandedTasks((prevExpandedTasks) => ({
      ...prevExpandedTasks,
      [taskId]: !prevExpandedTasks[taskId]
    }));
  };

  /**
   * Restores a task by setting its status to 'Pending'.
   *
   * @param {number} id - The ID of the task to restore.
   */
  const restoreTask = async (id) => {
    try {
      await db.runAsync("UPDATE tasks SET status = 'Pending' WHERE id = ?", [
        id
      ]);
      await loadArchivedTasksFromDB(db);
    } catch (error) {
      console.error("Error restoring task:", error);
    }
  };

  /**
   * Deletes a task from the database.
   *
   * @param {number} id - The ID of the task to delete.
   */
  const deleteTask = async (id) => {
    try {
      await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
      await loadArchivedTasksFromDB(db);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  /**
   * Renders a single task item.
   *
   * @param {Object} item - The task item to render.
   * @returns {JSX.Element} The rendered task item.
   */
  const renderTask = ({ item }) => {
    const isExpanded = expandedTasks[item.id];
    const dueDate = new Date(item.dueDate);

    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() => toggleExpand(item.id)}
      >
        <Text style={styles.taskTitle}>{item.title}</Text>
        {isExpanded && (
          <View style={styles.taskDetails}>
            <Text style={styles.taskText}>Description: {item.description}</Text>
            <Text style={styles.taskText}>
              Due Date: {dueDate.toLocaleDateString()}{" "}
              {dueDate.toLocaleTimeString()}
            </Text>
            <Text style={styles.taskText}>Status: {item.status}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={async () => {
                  await restoreTask(item.id);
                  await loadArchivedTasksFromDB(db);
                }}
              >
                <Image
                  source={require("../assets/x.png")} // Make sure to add this icon
                  style={styles.icon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={async () => {
                  await deleteTask(item.id);
                  await loadArchivedTasksFromDB(db);
                }}
              >
                <Image
                  source={require("../assets/delete.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {archivedTasks.length > 0 ? (
        <FlatList
          data={archivedTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTask}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => loadArchivedTasksFromDB(db)}
          refreshing={false}
        />
      ) : (
        <Text style={styles.emptyText}>No archived tasks available.</Text>
      )}
    </View>
  );
}

// Define styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff"
  },
  listContainer: {
    paddingBottom: 20
  },
  taskItem: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  taskDetails: {
    marginTop: 10
  },
  taskText: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333"
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10
  },
  iconButton: {
    padding: 5
  },
  icon: {
    width: 24,
    height: 24
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666"
  }
});

export default ArchivedTasksScreen;

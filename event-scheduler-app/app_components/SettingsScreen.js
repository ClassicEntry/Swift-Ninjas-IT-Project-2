import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Platform,
  Modal
} from "react-native";
import { useTheme } from "./ThemeContext";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const themes = {
  default: {
    primary: "#006064",
    background: "#F2F2F7",
    text: "#000000",
    taskBackground: "#FFFFFF",
    accent: "#34C759",
    error: "#FF3B30",
    warning: "#FF9500",
    success: "#30D158"
  },
  dark: {
    primary: "#006064",
    background: "#1C1C1E",
    text: "#FFFFFF",
    taskBackground: "#2C2C2E",
    accent: "#32D74B",
    error: "#FF453A",
    warning: "#FF9F0A",
    success: "#30D158"
  },
  nature: {
    primary: "#2D6A4F",
    background: "#ECF4F4",
    text: "#2D3436",
    taskBackground: "#FFFFFF",
    accent: "#40916C",
    error: "#D90429",
    warning: "#FF9F1C",
    success: "#95D5B2"
  },
  ocean: {
    primary: "#006D77",
    background: "#EDF6F9",
    text: "#2B2D42",
    taskBackground: "#FFFFFF",
    accent: "#83C5BE",
    error: "#E29578",
    warning: "#FFDDD2",
    success: "#006D77"
  },
  sunset: {
    primary: "#E76F51",
    background: "#FAF3E0",
    text: "#2A2A2A",
    taskBackground: "#FFFFFF",
    accent: "#F4A261",
    error: "#E76F51",
    warning: "#E9C46A",
    success: "#2A9D8F"
  },
  midnight: {
    primary: "#7400B8",
    background: "#10002B",
    text: "#E0AAFF",
    taskBackground: "#240046",
    accent: "#C77DFF",
    error: "#FF5C8D",
    warning: "#E0AAFF",
    success: "#9D4EDD"
  },
  forest: {
    primary: "#386641",
    background: "#F1F8E9",
    text: "#1B4332",
    taskBackground: "#FFFFFF",
    accent: "#6A994E",
    error: "#BC4749",
    warning: "#DDA15E",
    success: "#588157"
  },
  nordic: {
    primary: "#5E81AC",
    background: "#ECEFF4",
    text: "#2E3440",
    taskBackground: "#FFFFFF",
    accent: "#81A1C1",
    error: "#BF616A",
    warning: "#EBCB8B",
    success: "#A3BE8C"
  },
  monochrome: {
    primary: "#2C3E50",
    background: "#F5F6FA",
    text: "#2C3E50",
    taskBackground: "#FFFFFF",
    accent: "#34495E",
    error: "#95A5A6",
    warning: "#7F8C8D",
    success: "#566573"
  },
  pastel: {
    primary: "#98B2D1",
    background: "#FEF9EF",
    text: "#594157",
    taskBackground: "#FFFFFF",
    accent: "#D4B2D8",
    error: "#FF968A",
    warning: "#FFCB77",
    success: "#8DD99F"
  },
  autumn: {
    primary: "#9C6644",
    background: "#FCF5E5",
    text: "#523A28",
    taskBackground: "#FFFFFF",
    accent: "#CC9544",
    error: "#C1666B",
    warning: "#E4B363",
    success: "#748E63"
  },
  minimal: {
    primary: "#4A5568",
    background: "#FFFFFF",
    text: "#1A202C",
    taskBackground: "#F7FAFC",
    accent: "#718096",
    error: "#FC8181",
    warning: "#F6AD55",
    success: "#68D391"
  }
};

const StatItem = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </View>
);

const Section = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const SettingsScreen = ({ navigation }) => {
  const { theme, setTheme } = useTheme();
  const [isThemeListVisible, setIsThemeListVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [db, setDb] = useState(null);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    archivedTasks: 0,
    pendingTasks: 0
  });
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    if (db) {
      loadTaskStatistics();
    }
  }, [db]);

  const initializeDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync("tasks.db");
      setDb(database);
    } catch (error) {
      console.error("Database initialization error:", error);
    }
  };

  const loadTaskStatistics = async () => {
    if (!db) return;

    try {
      // Get total tasks
      const totalResult = await db.getAllAsync(
        "SELECT COUNT(*) as count FROM tasks"
      );
      const totalTasks = totalResult[0].count;

      // Get completed tasks (both 'Done' and 'Completed' status)
      const completedResult = await db.getAllAsync(
        "SELECT COUNT(*) as count FROM tasks WHERE status IN ('Done', 'Completed')"
      );
      const completedTasks = completedResult[0].count;

      // Get archived tasks
      const archivedResult = await db.getAllAsync(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'Archived'"
      );
      const archivedTasks = archivedResult[0].count;

      // Get pending tasks
      const pendingResult = await db.getAllAsync(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'Pending'"
      );
      const pendingTasks = pendingResult[0].count;

      setTaskStats({
        totalTasks,
        completedTasks,
        archivedTasks,
        pendingTasks
      });
    } catch (error) {
      console.error("Error loading task statistics:", error);
    }
  };

  const deleteAllData = async () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all tasks and history. This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync("DELETE FROM tasks");
              await db.runAsync("DELETE FROM history");
              await loadTaskStatistics();
              Alert.alert("Success", "All data has been deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete data");
            }
          }
        }
      ]
    );
  };

  const exportAllData = async () => {
    try {
      if (!db) return;

      const tasks = await db.getAllAsync("SELECT * FROM tasks");
      const history = await db.getAllAsync("SELECT * FROM history");
      const exportData = {
        tasks,
        history,
        exportDate: new Date().toISOString()
      };

      const fileUri = `${
        FileSystem.documentDirectory
      }taskManager_export_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(exportData, null, 2)
      );

      if (Platform.OS === "android" && !(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing isn't available on this device");
        return;
      }

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Export Error", "Failed to export data");
      console.error(error);
    }
  };

  const renderStatisticsModal = () => (
    <Modal
      visible={showStatsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStatsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View
          style={[styles.modalContent, { backgroundColor: theme.background }]}
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Task Statistics
          </Text>
          <View style={styles.statsContainer}>
            <StatItem
              label="Total Tasks"
              value={taskStats.totalTasks}
              color={theme.text}
            />
            <StatItem
              label="Completed"
              value={taskStats.completedTasks}
              color={theme.primary}
            />
            <StatItem
              label="Pending"
              value={taskStats.pendingTasks}
              color="#FFA500"
            />
            <StatItem
              label="Archived"
              value={taskStats.archivedTasks}
              color="#808080"
            />
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => setShowStatsModal(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Section title="Theme">
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => {
            setIsThemeListVisible(!isThemeListVisible);
            Animated.spring(animation, {
              toValue: isThemeListVisible ? 0 : 1,
              useNativeDriver: true
            }).start();
          }}
        >
          <Text style={styles.buttonText}>
            {isThemeListVisible ? "Hide Themes" : "Show Themes"}
          </Text>
        </TouchableOpacity>

        {isThemeListVisible && (
          <Animated.View
            style={[
              styles.themeList,
              {
                opacity: animation,
                transform: [
                  {
                    scale: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1]
                    })
                  }
                ]
              }
            ]}
          >
            {Object.entries(themes).map(([themeName, themeColors]) => (
              <TouchableOpacity
                key={themeName}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeColors.primary,
                    borderColor: themeColors.accent,
                    borderWidth: 1
                  }
                ]}
                onPress={() => setTheme(themeColors)}
              >
                <Text style={styles.buttonText}>
                  {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                </Text>
                <View style={styles.themePreview}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: themeColors.background }
                    ]}
                  />
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: themeColors.accent }
                    ]}
                  />
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: themeColors.text }
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </Section>

      <Section title="Task Overview">
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => setShowStatsModal(true)}
        >
          <Text style={styles.buttonText}>View Task Statistics</Text>
        </TouchableOpacity>
      </Section>

      <Section title="Data Management">
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={exportAllData}
        >
          <Text style={styles.buttonText}>Export All Data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FF3B30" }]}
          onPress={deleteAllData}
        >
          <Text style={styles.buttonText}>Delete All Data</Text>
        </TouchableOpacity>
      </Section>

      <Section title="App Information">
        <View style={styles.infoContainer}>
          <Text style={[styles.settingText, { color: theme.text }]}>
            Version: 1.0.0
          </Text>
          <Text style={[styles.settingText, { color: theme.text }]}>
            Database Status: {db ? "Connected" : "Not Connected"}
          </Text>
        </View>
      </Section>

      {renderStatisticsModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16
  },
  sectionContent: {
    gap: 12
  },
  button: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500"
  },
  themeList: {
    gap: 8
  },
  themeButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  settingText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 4
  },
  infoContainer: {
    alignItems: "center",
    padding: 8
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20
  },
  statItem: {
    alignItems: "center",
    width: "45%",
    marginVertical: 10
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold"
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4
  },
  themePreview: {
    flexDirection: "row",
    gap: 4
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)"
  }
});

export default SettingsScreen;

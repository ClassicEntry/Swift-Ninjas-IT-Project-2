import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import { useTheme } from "./ThemeContext";

const themes = {
  default: { primary: "#007AFF", background: "#F2F2F7", text: "#000000" },
  dark: { primary: "#0A84FF", background: "#1C1C1E", text: "#FFFFFF" },
  nature: { primary: "#4CAF50", background: "#E8F5E9", text: "#1B5E20" },
  ocean: { primary: "#0288D1", background: "#E1F5FE", text: "#01579B" },
};

function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const [isThemeListVisible, setIsThemeListVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultView, setDefaultView] = useState("calendar");

  const changeTheme = (newTheme) => {
    setTheme(themes[newTheme]);
  };

  const toggleThemeList = () => {
    setIsThemeListVisible(!isThemeListVisible);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const changeDefaultView = (view) => {
    setDefaultView(view);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Theme Colours
      </Text>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleThemeList}>
        <Text style={styles.buttonText}>
          {isThemeListVisible ? "Hide Theme Colours" : "Show Theme Colours"}
        </Text>
      </TouchableOpacity>
      {isThemeListVisible && (
        <View style={styles.themeList}>
          {Object.keys(themes).map((themeName) => (
            <TouchableOpacity
              key={themeName}
              style={[
                styles.themeButton,
                { backgroundColor: themes[themeName].primary },
              ]}
              onPress={() => changeTheme(themeName)}
            >
              <Text style={styles.buttonText}>
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.settingItem}>
        <Text style={[styles.settingText, { color: theme.text }]}>
          Notifications
        </Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={[styles.settingText, { color: theme.text }]}>
          Default View
        </Text>
        <View style={styles.viewOptions}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              defaultView === "calendar" && styles.selectedViewButton,
            ]}
            onPress={() => changeDefaultView("calendar")}
          >
            <Text style={styles.buttonText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              defaultView === "list" && styles.selectedViewButton,
            ]}
            onPress={() => changeDefaultView("list")}
          >
            <Text style={styles.buttonText}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={[styles.settingText, { color: theme.text }]}>
          App Version
        </Text>
        <Text style={[styles.settingText, { color: theme.text }]}>1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  toggleButton: {
    padding: 10,
    margin: 10,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    width: 200,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  themeList: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  themeButton: {
    padding: 15,
    margin: 10,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 10,
    marginVertical: 5,
  },
  settingText: {
    fontSize: 18,
  },
  viewOptions: {
    flexDirection: "row",
  },
  viewButton: {
    padding: 10,
    margin: 5,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  selectedViewButton: {
    backgroundColor: "#005BB5",
  },
});

export default SettingsScreen;

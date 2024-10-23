import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import CompletedTasksScreen from "./app_components/CompletedTasksScreen";
import SettingsScreen from "./app_components/SettingsScreen";
import { ThemeProvider, useTheme } from "./app_components/ThemeContext";
import TaskHistoryView from "./app_components/TaskHistoryView";
import ArchivedTasksScreen from "./app_components/ArchivedTasksScreen";
import { MainScreen } from "./app_components/MainScreen";

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Drawer.Navigator testID="main-navigator" initialRouteName="Main">
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

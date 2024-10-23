import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import CompletedTasksScreen from "./app_components/CompletedTasksScreen";
import SettingsScreen from "./app_components/SettingsScreen";
import { ThemeProvider } from "./app_components/ThemeContext";
import TaskHistoryView from "./app_components/TaskHistoryView";
import ArchivedTasksScreen from "./app_components/ArchivedTasksScreen";
import { MainScreen } from "./app_components/MainScreen";

// Create a Drawer Navigator
const Drawer = createDrawerNavigator();

/**
 * The main application component that sets up the navigation structure.
 * It uses a ThemeProvider for theming and a NavigationContainer for navigation.
 * The Drawer.Navigator component is used to create a drawer-based navigation with multiple screens.
 *
 * @component
 * @returns {JSX.Element} The main application component.
 */
export default function App() {
  return (
    // Provide theme context to the entire app
    <ThemeProvider>
      {/* Set up the navigation container */}
      <NavigationContainer>
        {/* Set up the drawer navigator with initial route as "Main" */}
        <Drawer.Navigator testID="main-navigator" initialRouteName="Main">
          {/* Define the screens in the drawer navigator */}
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

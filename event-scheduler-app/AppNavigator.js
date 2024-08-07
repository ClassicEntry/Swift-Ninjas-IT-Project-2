import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TaskManagerScreen from './Screens/TaskManagerScreen';
import AnotherScreen from './Screens/AnotherScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator>
                <Tab.Screen name="Tasks" component={TaskManagerScreen} />
                <Tab.Screen name="Another" component={AnotherScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { View, TouchableOpacity, Text } from "react-native";
import { ThemeProvider, useTheme } from "../app_components/ThemeContext";

describe("ThemeContext", () => {
  it("provides the default theme", () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return (
        <View testID="test-view" style={{ backgroundColor: theme.primary }}>
          <Text>Test</Text>
        </View>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const testView = getByTestId("test-view");
    expect(testView.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#006064" })
    );
  });

  it("allows updating the theme", () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <View>
          <View testID="test-view" style={{ backgroundColor: theme.primary }}>
            <Text>Test</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTheme({ primary: "#FF0000" })}
            testID="theme-button"
          >
            <Text>Change Theme</Text>
          </TouchableOpacity>
        </View>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const testView = getByTestId("test-view");
    expect(testView.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#006064" })
    );

    const button = getByTestId("theme-button");
    fireEvent.press(button);

    expect(testView.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#FF0000" })
    );
  });

  it("ensures all theme properties are present when updating the theme", () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <View>
          <View
            testID="test-view"
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.background
            }}
          >
            <Text>Test</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTheme({ primary: "#FF0000" })}
            testID="theme-button"
          >
            <Text>Change Theme</Text>
          </TouchableOpacity>
        </View>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const testView = getByTestId("test-view");
    expect(testView.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: "#006064",
        borderColor: "#F2F2F7"
      })
    );

    const button = getByTestId("theme-button");
    fireEvent.press(button);

    expect(testView.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: "#FF0000",
        borderColor: "#F2F2F7"
      })
    );
  });

  it("does not throw an error if useTheme is used within ThemeProvider", () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return (
        <View testID="test-view">
          <Text>{theme.primary}</Text>
        </View>
      );
    };

    expect(() => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
    }).not.toThrow();
  });

  it("provides all default theme properties", () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return (
        <View testID="theme-test">
          <Text testID="primary">{theme.primary}</Text>
          <Text testID="background">{theme.background}</Text>
          <Text testID="text">{theme.text}</Text>
          <Text testID="taskBackground">{theme.taskBackground}</Text>
          <Text testID="accent">{theme.accent}</Text>
          <Text testID="error">{theme.error}</Text>
          <Text testID="warning">{theme.warning}</Text>
          <Text testID="success">{theme.success}</Text>
        </View>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Get the Text components and check their children props instead of using toHaveTextContent
    expect(getByTestId("primary").props.children).toBe("#006064");
    expect(getByTestId("background").props.children).toBe("#F2F2F7");
    expect(getByTestId("text").props.children).toBe("#000000");
    expect(getByTestId("taskBackground").props.children).toBe("#FFFFFF");
    expect(getByTestId("accent").props.children).toBe("#34C759");
    expect(getByTestId("error").props.children).toBe("#FF3B30");
    expect(getByTestId("warning").props.children).toBe("#FF9500");
    expect(getByTestId("success").props.children).toBe("#30D158");
  });

  it("preserves default theme values when partially updating theme", () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <View>
          <View testID="theme-view">
            <Text testID="primary">{theme.primary}</Text>
            <Text testID="background">{theme.background}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTheme({ primary: "#FF0000" })}
            testID="theme-button"
          >
            <Text>Update Theme</Text>
          </TouchableOpacity>
        </View>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = getByTestId("theme-button");
    fireEvent.press(button);

    expect(getByTestId("primary").props.children).toBe("#FF0000");
    expect(getByTestId("background").props.children).toBe("#F2F2F7");
  });
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SettingsScreen from "../app_components/SettingsScreen";
import { ThemeProvider } from "../app_components/ThemeContext";

// Mock initial theme value
const mockTheme = {
  primary: "#007AFF",
  background: "#F2F2F7",
  text: "#000000"
};

// Mock theme context
jest.mock("../app_components/ThemeContext", () => ({
  useTheme: jest.fn().mockReturnValue({
    theme: mockTheme,
    setTheme: jest.fn()
  }),
  ThemeProvider: ({ children }) => children
}));

describe("SettingsScreen", () => {
  let mockSetTheme;

  beforeEach(() => {
    mockSetTheme = jest.fn();
    require("../app_components/ThemeContext").useTheme.mockReturnValue({
      theme: mockTheme,
      setTheme: mockSetTheme
    });
  });

  it("renders correctly", () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText("Theme Colours")).toBeTruthy();
    expect(getByText("Notifications")).toBeTruthy();
    expect(getByText("Default View")).toBeTruthy();
    expect(getByText("App Version")).toBeTruthy();
  });

  it("toggles theme list visibility", () => {
    const { getByText, queryByText } = render(<SettingsScreen />);
    const toggleButton = getByText("Show Theme Colours");

    fireEvent.press(toggleButton);
    expect(getByText("Hide Theme Colours")).toBeTruthy();
    expect(getByText("Default")).toBeTruthy();
    expect(getByText("Dark")).toBeTruthy();
    expect(getByText("Nature")).toBeTruthy();
    expect(getByText("Ocean")).toBeTruthy();

    fireEvent.press(toggleButton);
    expect(getByText("Show Theme Colours")).toBeTruthy();
    expect(queryByText("Default")).toBeNull();
  });

  it("changes theme", () => {
    const { getByText, getByTestId } = render(<SettingsScreen />);

    // Show theme list
    fireEvent.press(getByText("Show Theme Colours"));

    // Press dark theme button
    const darkThemeButton = getByTestId("theme-button-dark");
    fireEvent.press(darkThemeButton);

    // Verify theme was updated
    expect(mockSetTheme).toHaveBeenCalledWith({
      primary: "#0A84FF",
      background: "#1C1C1E",
      text: "#FFFFFF"
    });
  });

  it("toggles notifications", () => {
    const { getByTestId } = render(<SettingsScreen />);
    const switchElement = getByTestId("notifications-switch");

    // Initial state should be true
    expect(switchElement.props.value).toBe(true);

    // Toggle notifications off
    fireEvent(switchElement, "valueChange", false);
    expect(switchElement.props.value).toBe(false);
  });

  it("changes default view", () => {
    const { getByTestId } = render(<SettingsScreen />);

    const listButton = getByTestId("view-button-list");
    const calendarButton = getByTestId("view-button-calendar");

    // Press list button
    fireEvent.press(listButton);
    expect(listButton).toHaveStyle({ backgroundColor: "#005BB5" });

    // Press calendar button
    fireEvent.press(calendarButton);
    expect(calendarButton).toHaveStyle({ backgroundColor: "#005BB5" });
  });
});

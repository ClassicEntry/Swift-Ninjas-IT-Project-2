import React from "react";
import { render } from "@testing-library/react-native";
import App from "../App";

// Mock React.Children to avoid out-of-scope variable access
const mockReactChildren = React.Children;

// Track registered screens
const mockScreens = [];

// Mock the navigation container
jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }) => children
}));

// Mock the drawer navigator
jest.mock("@react-navigation/drawer", () => ({
  createDrawerNavigator: () => ({
    Navigator: ({ children, testID }) => {
      // Clear previous screens
      mockScreens.length = 0;
      // Add current screens
      if (Array.isArray(children)) {
        children.forEach((child) => {
          if (child.props?.name) {
            mockScreens.push(child.props.name);
          }
        });
      } else if (children?.props?.name) {
        mockScreens.push(children.props.name);
      }
      return <mock-navigator testID={testID}>{children}</mock-navigator>;
    },
    Screen: ({ name, component }) => (
      <mock-screen name={name}>{name}</mock-screen>
    )
  })
}));

// Mock the theme provider
jest.mock("../app_components/ThemeContext", () => ({
  ThemeProvider: ({ children }) => (
    <mock-theme-provider>{children}</mock-theme-provider>
  )
}));

describe("App Navigation", () => {
  beforeEach(() => {
    // Clear mock screens before each test
    mockScreens.length = 0;
  });

  it("renders the main navigator", () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId("main-navigator")).toBeTruthy();
  });

  it("contains all expected screens in navigation", () => {
    render(<App />);

    const expectedScreens = [
      "Main",
      "Completed Tasks",
      "Archived Tasks",
      "History",
      "Settings"
    ];

    expectedScreens.forEach((screenName) => {
      expect(mockScreens).toContain(screenName);
    });
  });

  it("wraps the app with ThemeProvider", () => {
    const { UNSAFE_getAllByType } = render(<App />);
    expect(() => UNSAFE_getAllByType("mock-theme-provider")).not.toThrow();
  });
});

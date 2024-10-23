import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import CompletedTasksScreen from "../app_components/CompletedTasksScreen";
import * as SQLite from "expo-sqlite";
import { useTheme } from "../app_components/ThemeContext";

jest.mock("expo-sqlite");
jest.mock("../app_components/ThemeContext", () => ({
  useTheme: jest.fn()
}));

// Create a wrapper component that provides navigation context
const TestWrapper = ({ children }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

const mockNavigation = {
  navigate: jest.fn(),
  addListener: jest.fn(() => () => {}),
  removeListener: jest.fn(),
  dispatch: jest.fn()
};

describe("CompletedTasksScreen", () => {
  beforeEach(() => {
    SQLite.openDatabaseAsync.mockResolvedValue({
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn()
    });
    useTheme.mockReturnValue({ theme: "light" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Done"
      }
    ];

    SQLite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    });

    const { getByText } = render(
      <TestWrapper>
        <CompletedTasksScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText("Task 1")).toBeTruthy();
    });
  });

  it("expands and collapses task details on press", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Done"
      }
    ];

    SQLite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    });

    const { getByText, queryByText } = render(
      <TestWrapper>
        <CompletedTasksScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => getByText("Task 1"));

    fireEvent.press(getByText("Task 1"));
    await waitFor(() => {
      expect(getByText("Description: Description 1")).toBeTruthy();
    });

    fireEvent.press(getByText("Task 1"));
    await waitFor(() => {
      expect(queryByText("Description: Description 1")).toBeNull();
    });
  });

  it("calls undoTask when undo button is pressed", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Done"
      }
    ];

    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    };

    SQLite.openDatabaseAsync.mockResolvedValueOnce(mockDb);

    const { getByText, getByTestId } = render(
      <TestWrapper>
        <CompletedTasksScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => getByText("Task 1"));

    fireEvent.press(getByText("Task 1"));
    fireEvent.press(getByTestId("undo-button-1"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "UPDATE tasks SET status = 'Pending' WHERE id = ?",
        [1]
      );
    });
  });

  it("calls archiveTask when archive button is pressed", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Done"
      }
    ];

    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    };

    SQLite.openDatabaseAsync.mockResolvedValueOnce(mockDb);

    const { getByText, getByTestId } = render(
      <TestWrapper>
        <CompletedTasksScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => getByText("Task 1"));

    fireEvent.press(getByText("Task 1"));
    fireEvent.press(getByTestId("archive-button-1"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "UPDATE tasks SET status = 'Archived' WHERE id = ?",
        [1]
      );
    });
  });

  it("calls deleteTask when delete button is pressed", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Done"
      }
    ];

    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    };

    SQLite.openDatabaseAsync.mockResolvedValueOnce(mockDb);

    const { getByText, getByTestId } = render(
      <TestWrapper>
        <CompletedTasksScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => getByText("Task 1"));

    fireEvent.press(getByText("Task 1"));
    fireEvent.press(getByTestId("delete-button-1"));

    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "DELETE FROM tasks WHERE id = ?",
        [1]
      );
    });
  });

  it("shows empty state message when no tasks", async () => {
    SQLite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn()
    });

    const { getByText } = render(
      <TestWrapper>
        <CompletedTasksScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText("No completed tasks available.")).toBeTruthy();
    });
  });
});

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ArchivedTasksScreen from "../app_components/ArchivedTasksScreen";
import * as SQLite from "expo-sqlite";
import { useTheme } from "../app_components/ThemeContext";

jest.mock("expo-sqlite");
jest.mock("../app_components/ThemeContext", () => ({
  useTheme: jest.fn()
}));

const mockNavigation = {
  navigate: jest.fn()
};

describe("ArchivedTasksScreen", () => {
  beforeEach(() => {
    SQLite.openDatabaseAsync.mockResolvedValue({
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn()
    });
    useTheme.mockReturnValue({ theme: "light" });
  });

  it("renders correctly with no archived tasks", async () => {
    const { getByText } = render(
      <ArchivedTasksScreen navigation={mockNavigation} />
    );
    await waitFor(() => {
      expect(getByText("No archived tasks available.")).toBeTruthy();
    });
  });

  it("loads archived tasks from the database", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Archived"
      },
      {
        id: 2,
        title: "Task 2",
        description: "Description 2",
        dueDate: new Date().toISOString(),
        status: "Archived"
      }
    ];
    SQLite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    });

    const { getByText } = render(
      <ArchivedTasksScreen navigation={mockNavigation} />
    );
    await waitFor(() => {
      expect(getByText("Task 1")).toBeTruthy();
      expect(getByText("Task 2")).toBeTruthy();
    });
  });

  it("expands and collapses task details", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Archived"
      }
    ];
    SQLite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    });

    const { getByText, queryByText } = render(
      <ArchivedTasksScreen navigation={mockNavigation} />
    );
    await waitFor(() => {
      expect(getByText("Task 1")).toBeTruthy();
    });

    fireEvent.press(getByText("Task 1"));
    await waitFor(() => {
      expect(getByText("Description: Description 1")).toBeTruthy();
    });

    fireEvent.press(getByText("Task 1"));
    await waitFor(() => {
      expect(queryByText("Description: Description 1")).toBeNull();
    });
  });

  it("restores a task", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Archived"
      }
    ];
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValueOnce(mockDb);

    const { getByText, getByRole } = render(
      <ArchivedTasksScreen navigation={mockNavigation} />
    );
    await waitFor(() => {
      expect(getByText("Task 1")).toBeTruthy();
    });

    fireEvent.press(getByText("Task 1"));
    await waitFor(() => {
      expect(getByText("Description: Description 1")).toBeTruthy();
    });

    fireEvent.press(getByRole("button", { name: /restore/i }));
    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "UPDATE tasks SET status = 'Pending' WHERE id = ?",
        [1]
      );
    });
  });

  it("deletes a task", async () => {
    const mockTasks = [
      {
        id: 1,
        title: "Task 1",
        description: "Description 1",
        dueDate: new Date().toISOString(),
        status: "Archived"
      }
    ];
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue(mockTasks),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValueOnce(mockDb);

    const { getByText, getByRole } = render(
      <ArchivedTasksScreen navigation={mockNavigation} />
    );
    await waitFor(() => {
      expect(getByText("Task 1")).toBeTruthy();
    });

    fireEvent.press(getByText("Task 1"));
    await waitFor(() => {
      expect(getByText("Description: Description 1")).toBeTruthy();
    });

    fireEvent.press(getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "DELETE FROM tasks WHERE id = ?",
        [1]
      );
    });
  });
});

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import ArchivedTasksScreen from "../app_components/ArchivedTasksScreen";
import * as SQLite from "expo-sqlite";

jest.mock("expo-sqlite");
jest.mock("../app_components/ThemeContext", () => ({
  useTheme: jest.fn().mockReturnValue({ theme: "light" })
}));

describe("ArchivedTasksScreen Additional Tests", () => {
  const mockNavigation = {
    navigate: jest.fn(),
    addListener: jest.fn(() => () => {})
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test database initialization error handling
  it("handles database initialization errors", async () => {
    console.error = jest.fn(); // Mock console.error
    SQLite.openDatabaseAsync.mockRejectedValue(new Error("DB Init Error"));

    render(
      <NavigationContainer>
        <ArchivedTasksScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error initializing database:",
        expect.any(Error)
      );
    });
  });

  // Test database loading error handling
  it("handles database loading errors", async () => {
    const mockDb = {
      getAllAsync: jest.fn().mockRejectedValue(new Error("Loading Error")),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    console.error = jest.fn();

    render(
      <NavigationContainer>
        <ArchivedTasksScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error loading archived tasks:",
        expect.any(Error)
      );
    });
  });

  // Test task restoration error handling
  it("handles task restoration errors", async () => {
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: "Test Task",
          description: "Test Description",
          dueDate: new Date().toISOString(),
          status: "Archived"
        }
      ]),
      runAsync: jest.fn().mockRejectedValue(new Error("Restore Error"))
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    console.error = jest.fn();

    const { getByText } = render(
      <NavigationContainer>
        <ArchivedTasksScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText("Test Task")).toBeTruthy();
    });

    fireEvent.press(getByText("Test Task"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error restoring task:",
        expect.any(Error)
      );
    });
  });

  // Test task deletion error handling
  it("handles task deletion errors", async () => {
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: "Test Task",
          description: "Test Description",
          dueDate: new Date().toISOString(),
          status: "Archived"
        }
      ]),
      runAsync: jest.fn().mockRejectedValue(new Error("Delete Error"))
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    console.error = jest.fn();

    const { getByText } = render(
      <NavigationContainer>
        <ArchivedTasksScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText("Test Task")).toBeTruthy();
    });

    fireEvent.press(getByText("Test Task"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error deleting task:",
        expect.any(Error)
      );
    });
  });

  // Test screen focus effect
  it("refreshes tasks when screen comes into focus", async () => {
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    render(
      <NavigationContainer>
        <ArchivedTasksScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
    });

    // Simulate screen focus
    mockNavigation.addListener.mock.calls[0][1]();

    await waitFor(() => {
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(2);
    });
  });

  // Test date formatting
  it("correctly formats dates in task items", async () => {
    const testDate = new Date("2024-01-01T12:00:00");
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: "Test Task",
          description: "Description",
          dueDate: testDate.toISOString(),
          status: "Archived"
        }
      ]),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    const { getByText } = render(
      <NavigationContainer>
        <ArchivedTasksScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText("Test Task")).toBeTruthy();
    });

    fireEvent.press(getByText("Test Task"));

    await waitFor(() => {
      expect(
        getByText(
          `Due Date: ${testDate.toLocaleDateString()} ${testDate.toLocaleTimeString()}`
        )
      ).toBeTruthy();
    });
  });
});

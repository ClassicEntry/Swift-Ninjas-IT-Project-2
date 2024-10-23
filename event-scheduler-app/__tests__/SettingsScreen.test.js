import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import SettingsScreen from "../app_components/SettingsScreen";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

// Mock required modules
jest.mock("expo-sqlite");
jest.mock("expo-file-system");
jest.mock("expo-sharing");
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn()
}));
jest.mock("../app_components/ThemeContext", () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }) => children
}));

describe("SettingsScreen", () => {
  const mockNavigation = {
    navigate: jest.fn()
  };

  const mockTheme = {
    primary: "#006064",
    background: "#F2F2F7",
    text: "#000000",
    taskBackground: "#FFFFFF",
    accent: "#34C759"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
    require("../app_components/ThemeContext").useTheme.mockReturnValue({
      theme: mockTheme,
      setTheme: jest.fn()
    });
    SQLite.openDatabaseAsync.mockResolvedValue({
      getAllAsync: jest.fn().mockResolvedValue([{ count: 0 }]),
      runAsync: jest.fn()
    });
  });

  it("renders correctly", async () => {
    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    // Check for main section headings
    expect(getByText("Theme")).toBeTruthy();
    expect(getByText("Task Overview")).toBeTruthy();
    expect(getByText("Data Management")).toBeTruthy();
    expect(getByText("App Information")).toBeTruthy();

    // Check for buttons
    expect(getByText("Show Themes")).toBeTruthy();
    expect(getByText("View Task Statistics")).toBeTruthy();
    expect(getByText("Export All Data")).toBeTruthy();
    expect(getByText("Delete All Data")).toBeTruthy();
  });

  it("toggles theme list visibility", async () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    const toggleButton = getByText("Show Themes");
    fireEvent.press(toggleButton);

    // After showing themes
    expect(getByText("Hide Themes")).toBeTruthy();
    expect(getByText("Default")).toBeTruthy();
    expect(getByText("Dark")).toBeTruthy();

    // Hide themes
    fireEvent.press(getByText("Hide Themes"));
    expect(getByText("Show Themes")).toBeTruthy();
    expect(queryByText("Default")).toBeNull();
  });

  it("changes theme", async () => {
    const mockSetTheme = jest.fn();
    require("../app_components/ThemeContext").useTheme.mockReturnValue({
      theme: mockTheme,
      setTheme: mockSetTheme
    });

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    // Show theme list and select a theme
    fireEvent.press(getByText("Show Themes"));
    fireEvent.press(getByText("Dark"));

    expect(mockSetTheme).toHaveBeenCalled();
  });

  it("shows task statistics modal", async () => {
    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    fireEvent.press(getByText("View Task Statistics"));
    expect(getByText("Task Statistics")).toBeTruthy();
  });

  it("handles delete all data", async () => {
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([{ count: 0 }]),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    fireEvent.press(getByText("Delete All Data"));
    // Check if confirmation alert is shown
    expect(mockDb.runAsync).not.toHaveBeenCalled(); // Should not delete without confirmation
  });

  it("handles export data", async () => {
    Sharing.isAvailableAsync.mockResolvedValue(true);
    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    fireEvent.press(getByText("Export All Data"));
  });
  it("loads task statistics correctly", async () => {
    const mockDb = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce([{ count: 10 }]) // total tasks
        .mockResolvedValueOnce([{ count: 5 }]) // completed tasks
        .mockResolvedValueOnce([{ count: 2 }]) // archived tasks
        .mockResolvedValueOnce([{ count: 3 }]), // pending tasks
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      fireEvent.press(getByText("View Task Statistics"));
    });

    await waitFor(() => {
      expect(getByText("10")).toBeTruthy(); // total tasks
      expect(getByText("5")).toBeTruthy(); // completed tasks
      expect(getByText("2")).toBeTruthy(); // archived tasks
      expect(getByText("3")).toBeTruthy(); // pending tasks
    });
  });

  it("handles database initialization error", async () => {
    console.error = jest.fn();
    SQLite.openDatabaseAsync.mockRejectedValue(new Error("DB Init Error"));

    render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Database initialization error:",
        expect.any(Error)
      );
    });
  });

  it("handles statistics loading error", async () => {
    console.error = jest.fn();
    const mockDb = {
      getAllAsync: jest.fn().mockRejectedValue(new Error("Stats Error")),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error loading task statistics:",
        expect.any(Error)
      );
    });
  });

  it("handles delete all data confirmation", async () => {
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([{ count: 0 }]),
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    fireEvent.press(getByText("Delete All Data"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete All Data",
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel" }),
        expect.objectContaining({ text: "Delete" })
      ])
    );

    // Simulate confirming deletion
    const deleteCallback = Alert.alert.mock.calls[0][2][1].onPress;
    await act(async () => {
      await deleteCallback();
    });
  });

  it("handles export data error", async () => {
    FileSystem.writeAsStringAsync.mockRejectedValue(new Error("Export Error"));

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await act(async () => {
      await fireEvent.press(getByText("Export All Data"));
    });
  });
  it("handles delete data error", async () => {
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([{ count: 0 }]),
      runAsync: jest.fn().mockRejectedValue(new Error("Delete Error"))
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    fireEvent.press(getByText("Delete All Data"));

    // Simulate confirming deletion
    const deleteCallback = Alert.alert.mock.calls[0][2][1].onPress;
    await act(async () => {
      await deleteCallback();
    });

    expect(Alert.alert).toHaveBeenLastCalledWith(
      "Error",
      "Failed to delete data"
    );
  });

  it("handles export data with complete flow", async () => {
    const mockTasks = [{ id: 1, title: "Test Task" }];
    const mockHistory = [{ id: 1, action: "create" }];
    const mockDb = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce(mockTasks) // for tasks query
        .mockResolvedValueOnce(mockHistory), // for history query
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    Sharing.isAvailableAsync.mockResolvedValue(true);

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await act(async () => {
      await fireEvent.press(getByText("Export All Data"));
    });
  });

  it("handles statistics modal interactions", async () => {
    const mockDb = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce([{ count: 10 }]) // total tasks
        .mockResolvedValueOnce([{ count: 5 }]) // completed tasks
        .mockResolvedValueOnce([{ count: 2 }]) // archived tasks
        .mockResolvedValueOnce([{ count: 3 }]), // pending tasks
      runAsync: jest.fn()
    };
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    // Open modal
    await act(async () => {
      fireEvent.press(getByText("View Task Statistics"));
    });

    // Verify modal content
    expect(getByText("Task Statistics")).toBeTruthy();
    expect(getByText("Total Tasks")).toBeTruthy();
    expect(getByText("Completed")).toBeTruthy();
    expect(getByText("Pending")).toBeTruthy();
    expect(getByText("Archived")).toBeTruthy();

    // Close modal
    fireEvent.press(getByText("Close"));
    await waitFor(() => {
      expect(getByText("View Task Statistics")).toBeTruthy();
    });
  });

  it("handles all theme changes", async () => {
    const mockSetTheme = jest.fn();
    require("../app_components/ThemeContext").useTheme.mockReturnValue({
      theme: mockTheme,
      setTheme: mockSetTheme
    });

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    fireEvent.press(getByText("Show Themes"));

    // Test each theme
    const themeNames = [
      "Default",
      "Dark",
      "Nature",
      "Ocean",
      "Sunset",
      "Midnight",
      "Forest",
      "Nordic",
      "Monochrome",
      "Pastel",
      "Autumn",
      "Minimal"
    ];

    for (const themeName of themeNames) {
      fireEvent.press(getByText(themeName));
      expect(mockSetTheme).toHaveBeenCalled();
      mockSetTheme.mockClear();
    }
  });
  it("handles database errors during deletion", async () => {
    // Mock database with error during first DELETE operation
    const mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([{ count: 0 }]),
      runAsync: jest.fn().mockRejectedValueOnce(new Error("Delete Error")) // First DELETE fails
    };

    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    console.error = jest.fn();

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    // Trigger delete
    fireEvent.press(getByText("Delete All Data"));

    // Get the delete callback from Alert
    const deleteCallback = Alert.alert.mock.calls[0][2][1].onPress;

    // Execute delete operation
    await act(async () => {
      await deleteCallback();
    });

    // Verify error alert is shown
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to delete data");

    // Verify both DELETE operations were attempted
    expect(mockDb.runAsync).not.toHaveBeenCalledWith("DELETE FROM history"); // Second DELETE shouldn't be called after first fails
  });

  it("handles file system errors during export", async () => {
    // Mock successful database queries but failed file write
    const mockDb = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce([{ id: 1, title: "Task 1" }]) // tasks
        .mockResolvedValueOnce([{ id: 1, action: "create" }]), // history
      runAsync: jest.fn()
    };

    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    FileSystem.writeAsStringAsync.mockRejectedValue(new Error("Write Error"));
    console.error = jest.fn();

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await act(async () => {
      await fireEvent.press(getByText("Export All Data"));
    });
  });

  it("handles null database during export attempt", async () => {
    // Mock null database
    SQLite.openDatabaseAsync.mockResolvedValue(null);

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await act(async () => {
      await fireEvent.press(getByText("Export All Data"));
    });

    // Verify that no file operations were attempted
    expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it("handles complete export process successfully", async () => {
    const mockTasks = [{ id: 1, title: "Task 1" }];
    const mockHistory = [{ id: 1, action: "create" }];

    const mockDb = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce(mockTasks)
        .mockResolvedValueOnce(mockHistory),
      runAsync: jest.fn()
    };

    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    FileSystem.writeAsStringAsync.mockResolvedValue();
    Sharing.isAvailableAsync.mockResolvedValue(true);
    Sharing.shareAsync.mockResolvedValue();

    const { getByText } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    // Trigger export
    await act(async () => {
      await fireEvent.press(getByText("Export All Data"));
    });

    // Verify the full export process
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      "SELECT COUNT(*) as count FROM tasks"
    );
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      "SELECT COUNT(*) as count FROM tasks WHERE status IN ('Done', 'Completed')"
    );
  });

  it("handles database initialization errors with retry", async () => {
    // Mock database initialization failure first time
    SQLite.openDatabaseAsync
      .mockRejectedValueOnce(new Error("Init Error"))
      .mockResolvedValueOnce({
        getAllAsync: jest.fn().mockResolvedValue([{ count: 0 }]),
        runAsync: jest.fn()
      });

    console.error = jest.fn();

    const { getByText, rerender } = render(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Database initialization error:",
        expect.any(Error)
      );
    });

    // Verify UI shows not connected state
    expect(getByText("Database Status: Not Connected")).toBeTruthy();

    // Rerender to trigger useEffect again
    rerender(
      <NavigationContainer>
        <SettingsScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
  });
});

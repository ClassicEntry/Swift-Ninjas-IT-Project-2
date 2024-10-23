import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import TaskHistoryView from "../app_components/TaskHistoryView";
import * as SQLite from "expo-sqlite";

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn()
}));

const mockDatabase = {
  getAllAsync: jest.fn()
};

describe("TaskHistoryView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SQLite.openDatabaseAsync.mockResolvedValue(mockDatabase);
  });

  it("renders loading indicator while loading", () => {
    const { getByTestId } = render(<TaskHistoryView />);
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders error message on database initialization error", async () => {
    SQLite.openDatabaseAsync.mockRejectedValue(new Error("Database error"));
    const { getByText } = render(<TaskHistoryView />);

    await waitFor(() => {
      expect(getByText("Failed to load task history")).toBeTruthy();
    });
  });

  it("renders task history items", async () => {
    const mockDate = new Date("2023-01-01T12:00:00Z");
    const mockHistory = [
      {
        id: 1,
        taskId: 1,
        oldStatus: "Created",
        newStatus: "Pending",
        changeDate: mockDate.toISOString(),
        title: "Task 1",
        description: "Description 1",
        current_status: "Pending"
      }
    ];
    mockDatabase.getAllAsync.mockResolvedValue(mockHistory);

    const { getByText } = render(<TaskHistoryView />);

    await waitFor(() => {
      expect(getByText("Task 1")).toBeTruthy();
      expect(getByText("Task created")).toBeTruthy();
      expect(getByText("Current Status: Pending")).toBeTruthy();
    });
  });

  it('renders "Task no longer exists" for deleted tasks', async () => {
    const mockDate = new Date("2023-01-02T12:00:00Z");
    const mockHistory = [
      {
        id: 2,
        taskId: 2,
        oldStatus: "Pending",
        newStatus: "Completed",
        changeDate: mockDate.toISOString(),
        title: null,
        description: null,
        current_status: "Deleted"
      }
    ];
    mockDatabase.getAllAsync.mockResolvedValue(mockHistory);

    const { getByText } = render(<TaskHistoryView />);

    await waitFor(() => {
      expect(getByText("Task no longer exists")).toBeTruthy();
      expect(
        getByText("Status changed from Pending to Completed")
      ).toBeTruthy();
      expect(getByText("Current Status: Deleted")).toBeTruthy();
    });
  });

  it("refreshes task history on pull-to-refresh", async () => {
    const mockHistory = [
      {
        id: 1,
        taskId: 1,
        oldStatus: "Created",
        newStatus: "Pending",
        changeDate: new Date().toISOString(),
        title: "Task 1",
        description: "Description 1",
        current_status: "Pending"
      }
    ];
    mockDatabase.getAllAsync.mockResolvedValue(mockHistory);

    const { getByTestId } = render(<TaskHistoryView />);

    await waitFor(() => {
      expect(getByTestId("history-list")).toBeTruthy();
    });

    fireEvent(getByTestId("history-list"), "refresh");

    await waitFor(() => {
      expect(mockDatabase.getAllAsync).toHaveBeenCalledTimes(2);
    });
  });
});

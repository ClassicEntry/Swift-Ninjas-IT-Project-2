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
    SQLite.openDatabaseAsync.mockResolvedValue(mockDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading indicator while loading", () => {
    const { getByTestId } = render(<TaskHistoryView />);
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders error message on database initialization error", async () => {
    SQLite.openDatabaseAsync.mockRejectedValue(new Error("Database error"));
    const { getByText } = render(<TaskHistoryView />);
    await waitFor(() =>
      expect(getByText("Failed to load task history")).toBeTruthy()
    );
  });

  it("renders task history items", async () => {
    const mockHistory = [
      {
        id: 1,
        taskId: 1,
        oldStatus: "Created",
        newStatus: "Pending",
        changeDate: "2023-01-01T00:00:00Z",
        title: "Task 1",
        description: "Description 1",
        current_status: "Pending"
      }
    ];
    mockDatabase.getAllAsync.mockResolvedValue(mockHistory);

    const { getByText } = render(<TaskHistoryView />);
    await waitFor(() => expect(getByText("Task 1")).toBeTruthy());
    expect(getByText("Task created")).toBeTruthy();
    expect(getByText("1/1/2023, 12:00:00 AM")).toBeTruthy();
    expect(getByText("Current Status: Pending")).toBeTruthy();
  });

  it('renders "Task no longer exists" for deleted tasks', async () => {
    const mockHistory = [
      {
        id: 2,
        taskId: 2,
        oldStatus: "Pending",
        newStatus: "Completed",
        changeDate: "2023-01-02T00:00:00Z",
        title: null,
        description: null,
        current_status: "Deleted"
      }
    ];
    mockDatabase.getAllAsync.mockResolvedValue(mockHistory);

    const { getByText } = render(<TaskHistoryView />);
    await waitFor(() =>
      expect(getByText("Task no longer exists")).toBeTruthy()
    );
    expect(getByText("Status changed from Pending to Completed")).toBeTruthy();
    expect(getByText("1/2/2023, 12:00:00 AM")).toBeTruthy();
    expect(getByText("Current Status: Deleted")).toBeTruthy();
  });

  it("refreshes task history on pull-to-refresh", async () => {
    const mockHistory = [
      {
        id: 1,
        taskId: 1,
        oldStatus: "Created",
        newStatus: "Pending",
        changeDate: "2023-01-01T00:00:00Z",
        title: "Task 1",
        description: "Description 1",
        current_status: "Pending"
      }
    ];
    mockDatabase.getAllAsync.mockResolvedValue(mockHistory);

    const { getByTestId } = render(<TaskHistoryView />);
    await waitFor(() => expect(getByTestId("flat-list")).toBeTruthy());

    fireEvent(getByTestId("flat-list"), "refresh");
    await waitFor(() =>
      expect(mockDatabase.getAllAsync).toHaveBeenCalledTimes(2)
    );
  });
});

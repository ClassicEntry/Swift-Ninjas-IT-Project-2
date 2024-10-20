import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import App from "../App"; // Adjust the path as necessary

describe("App Component", () => {
  it("renders the main screen correctly", () => {
    const { getByText } = render(<App />);
    expect(getByText("Event Manager")).toBeTruthy();
  });

  it("toggles between list and calendar view", () => {
    const { getByText } = render(<App />);
    const listViewButton = getByText("List View");
    const calendarViewButton = getByText("Calendar View");

    fireEvent.press(calendarViewButton);
    expect(getByText("Calendar View")).toBeTruthy();

    fireEvent.press(listViewButton);
    expect(getByText("List View")).toBeTruthy();
  });

  it("opens and closes the task modal", async () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(
      <App />
    );
    const addButton = getByText("Add Task");

    fireEvent.press(addButton);
    await waitFor(() => getByPlaceholderText("Task Title"));

    const closeButton = getByText("Close");
    fireEvent.press(closeButton);
    await waitFor(() =>
      expect(queryByPlaceholderText("Task Title")).toBeNull()
    );
  });

  it("adds a new task", async () => {
    const { getByText, getByPlaceholderText, getByDisplayValue } = render(
      <App />
    );
    const addButton = getByText("Add Task");

    fireEvent.press(addButton);
    await waitFor(() => getByPlaceholderText("Task Title"));

    fireEvent.changeText(getByPlaceholderText("Task Title"), "Test Task");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );

    const saveButton = getByText("Add Task");
    fireEvent.press(saveButton);

    await waitFor(() => getByText("Test Task"));
    expect(getByText("Test Task")).toBeTruthy();
    expect(getByText("Test Description")).toBeTruthy();
  });

  it("marks a task as done", async () => {
    const { getByText, getByPlaceholderText } = render(<App />);
    const addButton = getByText("Add Task");

    fireEvent.press(addButton);
    await waitFor(() => getByPlaceholderText("Task Title"));

    fireEvent.changeText(getByPlaceholderText("Task Title"), "Test Task");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );

    const saveButton = getByText("Add Task");
    fireEvent.press(saveButton);

    await waitFor(() => getByText("Test Task"));

    const markAsDoneButton = getByText("Mark as Done");
    fireEvent.press(markAsDoneButton);

    await waitFor(() => getByText("Done"));
    expect(getByText("Done")).toBeTruthy();
  });

  it("deletes a task", async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<App />);
    const addButton = getByText("Add Task");

    fireEvent.press(addButton);
    await waitFor(() => getByPlaceholderText("Task Title"));

    fireEvent.changeText(getByPlaceholderText("Task Title"), "Test Task");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );

    const saveButton = getByText("Add Task");
    fireEvent.press(saveButton);

    await waitFor(() => getByText("Test Task"));

    const deleteButton = getByText("Delete");
    fireEvent.press(deleteButton);

    await waitFor(() => expect(queryByText("Test Task")).toBeNull());
  });

  it("edits a task", async () => {
    const { getByText, getByPlaceholderText } = render(<App />);
    const addButton = getByText("Add Task");

    fireEvent.press(addButton);
    await waitFor(() => getByPlaceholderText("Task Title"));

    fireEvent.changeText(getByPlaceholderText("Task Title"), "Test Task");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Test Description"
    );

    const saveButton = getByText("Add Task");
    fireEvent.press(saveButton);

    await waitFor(() => getByText("Test Task"));

    const editButton = getByText("Edit");
    fireEvent.press(editButton);

    fireEvent.changeText(getByPlaceholderText("Task Title"), "Updated Task");
    fireEvent.changeText(
      getByPlaceholderText("Task Description"),
      "Updated Description"
    );

    const updateButton = getByText("Update Task");
    fireEvent.press(updateButton);

    await waitFor(() => getByText("Updated Task"));
    expect(getByText("Updated Task")).toBeTruthy();
    expect(getByText("Updated Description")).toBeTruthy();
  });
});

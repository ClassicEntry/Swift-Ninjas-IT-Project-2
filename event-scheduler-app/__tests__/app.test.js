import React from "react";
import { render } from "@testing-library/react-native";
import App from "../App";

describe("App Navigation", () => {
  it("renders the main navigator", () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId("main-navigator")).toBeTruthy();
  });

  it("renders the Main screen by default", () => {
    const { getByText } = render(<App />);
    expect(getByText("Main")).toBeTruthy();
  });

  it("renders the Completed Tasks screen", () => {
    const { getByText } = render(<App />);
    expect(getByText("Completed Tasks")).toBeTruthy();
  });

  it("renders the Archived Tasks screen", () => {
    const { getByText } = render(<App />);
    expect(getByText("Archived Tasks")).toBeTruthy();
  });

  it("renders the History screen", () => {
    const { getByText } = render(<App />);
    expect(getByText("History")).toBeTruthy();
  });

  it("renders the Settings screen", () => {
    const { getByText } = render(<App />);
    expect(getByText("Settings")).toBeTruthy();
  });
});

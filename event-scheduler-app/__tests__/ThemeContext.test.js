import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../app_components/ThemeContext";

const TestComponent = () => {
  const { theme } = useTheme();
  return (
    <div>
      <div data-testid="primary-color">{theme.primary}</div>
      <div data-testid="background-color">{theme.background}</div>
      <div data-testid="text-color">{theme.text}</div>
      <div data-testid="task-background-color">{theme.taskBackground}</div>
    </div>
  );
};

describe("ThemeContext", () => {
  it("provides the correct default theme values", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("primary-color").textContent).toBe("#007AFF");
    expect(screen.getByTestId("background-color").textContent).toBe("#F2F2F7");
    expect(screen.getByTestId("text-color").textContent).toBe("#000000");
    expect(screen.getByTestId("task-background-color").textContent).toBe(
      "#FFFFFF"
    );
  });

  it("allows theme to be updated", () => {
    const NewThemeComponent = () => {
      const { theme, setTheme } = useTheme();
      React.useEffect(() => {
        setTheme({
          primary: "#FF5733",
          background: "#C70039",
          text: "#900C3F",
          taskBackground: "#581845"
        });
      }, [setTheme]);

      return (
        <div>
          <div data-testid="primary-color">{theme.primary}</div>
          <div data-testid="background-color">{theme.background}</div>
          <div data-testid="text-color">{theme.text}</div>
          <div data-testid="task-background-color">{theme.taskBackground}</div>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <NewThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("primary-color").textContent).toBe("#FF5733");
    expect(screen.getByTestId("background-color").textContent).toBe("#C70039");
    expect(screen.getByTestId("text-color").textContent).toBe("#900C3F");
    expect(screen.getByTestId("task-background-color").textContent).toBe(
      "#581845"
    );
  });
});

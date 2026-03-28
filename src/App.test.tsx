import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the blind museum", () => {
  render(<App />);
  expect(screen.getByText(/the blind museum/i)).toBeTruthy();
});

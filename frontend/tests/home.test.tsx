import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "../src/app/page";
test("communicates actual availability without implying tools work", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    screen.getByRole("link", { name: /Find your starting point/ }),
  ).toHaveAttribute("href", "/register");
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DataWorkspace, type DataWorkspaceProps } from "../DataWorkspace";
import type { WorkspacePlugin } from "../types/plugin";

function createMockPlugin(overrides: Partial<WorkspacePlugin> = {}): WorkspacePlugin {
  return {
    id: "mock",
    name: "Mock Plugin",
    renderView: () => <div data-testid="mock-view">Mock View</div>,
    ...overrides
  };
}

function renderWorkspace(props?: Partial<DataWorkspaceProps>) {
  const plugin = createMockPlugin();
  return render(
    <DataWorkspace
      initialData={[{ city: "Seoul", temp: 20 }]}
      plugins={[plugin]}
      showDatasetPopover={false}
      {...props}
    />
  );
}

describe("DataWorkspace", () => {
  it("renders injected plugin view", async () => {
    renderWorkspace();
    expect(await screen.findByTestId("mock-view")).toBeInTheDocument();
  });

  it("toggles theme via toolbar control", async () => {
    const user = userEvent.setup();
    const { container } = renderWorkspace();
    await screen.findByTestId("mock-view");
    const toggleButton = screen.getByRole("button", { name: /dark mode/i });
    await user.click(toggleButton);
    expect(container.querySelector(".dark")).toBeTruthy();
  });

  it("applies default language strings", async () => {
    renderWorkspace({ defaultLanguage: "ko" });
    expect(await screen.findByText("데이터셋이 없습니다")).toBeInTheDocument();
  });
});

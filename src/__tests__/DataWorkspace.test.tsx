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

  it("shows the variable panel by default", async () => {
    renderWorkspace();
    await screen.findByTestId("mock-view");
    expect(screen.getByRole("button", { name: /resize variable panel/i })).toBeInTheDocument();
  });

  it("drops the variable panel whole when showVariableList is false", async () => {
    // Dropped, not hidden. A host that overlays it would leave the panel's own
    // controls — double-click to activate, the delete button on a derived
    // variable — reachable by keyboard while invisible, and would keep the width
    // the panel reserves. Both are why this is a prop rather than host CSS.
    renderWorkspace({ showVariableList: false });
    await screen.findByTestId("mock-view");
    expect(screen.queryByRole("button", { name: /resize variable panel/i })).not.toBeInTheDocument();
  });
});

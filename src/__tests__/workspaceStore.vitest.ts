import { describe, expect, it } from "vitest";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

describe("useWorkspaceStore", () => {
  it("updates dataset and variables", () => {
    const { setDataset, setVariables } = useWorkspaceStore.getState();
    setDataset([{ score: 42 }]);
    setVariables([{ name: "score", type: "continuous" }]);

    const snapshot = useWorkspaceStore.getState();
    expect(snapshot.dataset).toHaveLength(1);
    expect(snapshot.variables[0].name).toBe("score");
  });

  it("controls modal state", () => {
    const { openModal, closeModal } = useWorkspaceStore.getState();
    openModal("Hello");
    expect(useWorkspaceStore.getState().isModalOpen).toBe(true);
    closeModal();
    expect(useWorkspaceStore.getState().isModalOpen).toBe(false);
  });
});

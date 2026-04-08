# @winm2m/react-data-workspace

A Tailwind + Radix UI powered application shell that orchestrates statistical plugins such as `@winm2m/react-stats-ui`. It exposes a consistent layout (LNB + canvas + global variable rail), global theme/i18n controls, and a plugin contract so new analytical modules can snap in with minimal wiring.

## Features

- **Three-pane layout** with left navigation, central plugin canvas, and right-hand global variable inspector.
- **Shared dataset tooling** powered by `SharedDatasetPopover` so every plugin can reuse the same import flow.
- **Theme & language controls** (light/dark + full `react-stats-ui` locale list) backed by Zustand state and Tailwind dark styles.
- **Plugin system** via `WorkspacePlugin` definitions, including UI extension slots and event bridges for variable assignment.
- **StatsWorkbench helper** – `createStatsWorkbenchPlugin()` wraps `<StatsWorkbench />` with external variable handling enabled.
- **Storybook + Jest + Vitest** scaffolding to exercise UI and store logic out of the box.

## Getting Started

```bash
npm install @winm2m/react-data-workspace @winm2m/react-stats-ui react react-dom
```

### Basic Usage

```tsx
import { DataWorkspace, createStatsWorkbenchPlugin } from "@winm2m/react-data-workspace";

const plugins = [createStatsWorkbenchPlugin({ name: "Workbench" })];

export function App() {
  return (
    <DataWorkspace
      initialData={[{ city: "Seoul", temp: 23 }]}
      plugins={plugins}
      defaultTheme="light"
      showDatasetPopover
    />
  );
}
```

### Plugin Interface

```ts
export type UISlot = "GLOBAL_OVERLAY" | "DATASET_HEADER";

export interface WorkspacePlugin {
  id: string;
  name: string;
  icon?: ReactNode;
  renderView?: () => ReactNode;
  uiExtensions?: Array<{ slot: UISlot; render: () => ReactNode }>;
  capabilities?: {
    onVariableActivate?: (variableName: string) => void;
    onVariableSelect?: (variableName: string) => void;
  };
}
```

Use the `capabilities` callbacks to receive double-click/selection events from the global variable list. `uiExtensions` let plugins inject UI into workspace slots such as the dataset header or modal overlay.

### Commands

| Command | Description |
| --- | --- |
| `npm run build` | Builds the library with `tsup` (ESM + CJS + d.ts). |
| `npm run typecheck` | Runs strict TypeScript checking. |
| `npm run storybook` | Launches Storybook with Tailwind + dark mode globals. |
| `npm run test:jest` | Component/integration tests (React Testing Library). |
| `npm run test:vitest` | Store-level unit tests via Vitest. |

### Storybook

`src/DataWorkspace.stories.tsx` wires the shell with mock data and exposes toolbar toggles for theme/locales. Tailwind styles are loaded inside `.storybook/preview.ts` and the Themes addon keeps Storybook globals in sync with `DataWorkspace` props.

### Dataset Imports

The shared dataset popover accepts `.xlsx` and `.json` files. JSON uploads expect an array of records. Excel uploads are parsed with `xlsx` and automatically derive global variables displayed on the right rail.

## Development Notes

- Styling is implemented solely with Tailwind utility classes and respects `dark:` variants.
- Radix primitives (`Dialog`, `Select`, etc.) are used for accessibility-critical UI.
- The workspace store lives in `src/store/useWorkspaceStore.ts` and exposes theme/language/modal APIs for plugins.
- Tests assert plugin rendering, theme toggles, language initialization, and store mutations.

## License

MIT

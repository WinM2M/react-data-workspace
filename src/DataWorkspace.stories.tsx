import type { Meta, StoryObj } from "@storybook/react";
import { DataWorkspace, type DataWorkspaceProps, createStatsWorkbenchPlugin } from "./DataWorkspace";

const statsPlugin = createStatsWorkbenchPlugin();

const meta: Meta<DataWorkspaceProps> = {
  title: "Workspace/DataWorkspace",
  component: DataWorkspace,
  parameters: {
    layout: "fullscreen"
  }
};

export default meta;

type Story = StoryObj<DataWorkspaceProps>;

const demoData = [
  { city: "Seoul", temperature: 23.4, humidity: 46, condition: "Sunny" },
  { city: "Busan", temperature: 21.1, humidity: 52, condition: "Cloudy" },
  { city: "Tokyo", temperature: 25.6, humidity: 44, condition: "Sunny" }
];

export const Playground: Story = {
  args: {
    initialData: demoData,
    plugins: [statsPlugin],
    showDatasetPopover: true,
    defaultLanguage: "en"
  },
  render: (args, context) => {
    const theme = context.globals?.theme === "dark" ? "dark" : "light";
    const language = (context.globals as Record<string, string>)?.locale ?? args.defaultLanguage ?? "en";
    return <DataWorkspace {...args} defaultTheme={theme} defaultLanguage={language} />;
  }
};

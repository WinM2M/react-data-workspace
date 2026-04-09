import React from "react";
import { createRoot } from "react-dom/client";
import { DataWorkspace, createStatsWorkbenchPlugin } from "./DataWorkspace";

const demoData = [
  { city: "Seoul", temperature: 23.4, humidity: 46, condition: "Sunny" },
  { city: "Busan", temperature: 21.1, humidity: 52, condition: "Cloudy" },
  { city: "Tokyo", temperature: 25.6, humidity: 44, condition: "Sunny" }
];

const root = createRoot(document.getElementById("app")!);

root.render(
  <DataWorkspace
    initialData={demoData}
    plugins={[createStatsWorkbenchPlugin()]}
    defaultTheme="light"
    defaultLanguage="en"
  />
);

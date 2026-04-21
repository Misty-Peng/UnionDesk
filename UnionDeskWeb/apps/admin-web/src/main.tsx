import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0f766e",
          borderRadius: 14,
          fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif'
        },
        algorithm: theme.defaultAlgorithm
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);

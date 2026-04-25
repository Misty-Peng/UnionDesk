import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import { BrowserRouter } from "react-router-dom";
import { setClientCode } from "@uniondesk/shared";
import App from "./App";
import "./index.css";

setClientCode("ud-customer-web");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 12,
          fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif'
        },
        algorithm: theme.defaultAlgorithm
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);

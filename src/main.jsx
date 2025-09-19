import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css"; // 👈 esta es la línea que agrega el estilo

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
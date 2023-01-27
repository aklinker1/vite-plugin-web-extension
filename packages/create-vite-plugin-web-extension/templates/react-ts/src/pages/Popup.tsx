import React from "react";
import ReactDOM from "react-dom/client";
import './Popup.css';

function Popup() {
  console.log("Hello from the popup!");

  return (
    <div>
      <img src="/icon-with-shadow.svg" />
      <h1>vite-plugin-web-extension</h1>
      <p>
        Template: <code>${{ template.templateName }}</code>
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);

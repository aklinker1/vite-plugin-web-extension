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
        Template 2: <code>react-ts</code>
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);

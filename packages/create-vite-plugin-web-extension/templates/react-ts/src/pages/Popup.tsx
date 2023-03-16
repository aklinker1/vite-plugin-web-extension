import { useEffect } from 'react';
import "./Popup.css";

function Popup() {
  useEffect(() => {
    console.log("Hello from the popup!");
  }, []);

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

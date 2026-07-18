import { useEffect } from "react";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export function CrispChat() {
  useEffect(() => {
    // Prevent loading twice
    if (document.getElementById("crisp-script")) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "aad99cd5-8df1-4a17-b217-dbe68429351c";

    const script = document.createElement("script");
    script.id = "crisp-script";
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;

    document.head.appendChild(script);
  }, []);

  return null;
}
import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

const TawkChat = () => {
  useEffect(() => {
    // Prevent loading twice
    if (document.getElementById("tawk-script")) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");

    script.id = "tawk-script";
    script.async = true;
    script.src =
      "https://embed.tawk.to/6a718163a3eed11d4902929e/1jv5m2s0j";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById("tawk-script");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
};

export default TawkChat;
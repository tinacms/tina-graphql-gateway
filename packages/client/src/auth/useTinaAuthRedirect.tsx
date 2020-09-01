import { useEffect } from "react";

const TINA_AUTH_CONFIG = "tina_auth_config";
export const useTinaAuthRedirect = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const config = {
      code: urlParams.get("code") || "",
      scope: urlParams.get("scope") || "email",
      state: urlParams.get("state"),
    };

    localStorage[TINA_AUTH_CONFIG] = JSON.stringify(config);
  }, []);
};

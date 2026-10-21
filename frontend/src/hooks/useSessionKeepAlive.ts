import { useEffect } from "react";
import { getCurrentUser } from "../services/api";

export function useSessionKeepAlive() {
  useEffect(() => {
    const interval = setInterval(
      () => {
        const token = localStorage.getItem("session_token");

        if (token) {
          getCurrentUser().catch(() => {
            // api.ts sẽ tự xử lý nếu phiên hết hạn
          });
        }
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);
}

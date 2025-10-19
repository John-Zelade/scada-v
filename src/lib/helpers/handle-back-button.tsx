import { useState, useEffect } from "react";
import { useActiveTabStore } from "@/stores/active-tab-store";
import { useRouter } from "@tanstack/react-router";

export const useBackButton = (enableAlert: boolean) => {
  const { setActiveTab } = useActiveTabStore();
  const router = useRouter();

  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = router.subscribe("onBeforeNavigate", () => {
      const path = router.state.location.pathname;

      if (path === "/app/home") setActiveTab("home");
      else if (path === "/app/dashboard") setActiveTab("dashboard");
      else if (path === "/app/add-task") setActiveTab("add-task");
      else if (path === "/app/calendar") setActiveTab("calendar");
      else if (path === "/app/setting") setActiveTab("setting");
      else setActiveTab("home");
    });

    return () => unsubscribe();
  }, [router, setActiveTab]);

  useEffect(() => {
    if (!enableAlert) return;

    const handleHardwareBack = () => {
      const path = router.state.location.pathname;

      if (path !== "/app/home" && path !== "/") {
        router.history.back();
      } else {
        // If on home page, show exit confirmation dialog
        setShowExitDialog(true);
      }
    };

    window.addEventListener("hardware-back-button", handleHardwareBack);
    return () =>
      window.removeEventListener("hardware-back-button", handleHardwareBack);
  }, [enableAlert, router]);

  // Expose dialog state and handlers so your component can render the dialog
  return {
    showExitDialog,
    onConfirmExit: () => {
      setShowExitDialog(false);
      (window as any).NativeBridge.exitApp();
    },
    onCancelExit: () => setShowExitDialog(false),
  };
};

export default useBackButton;

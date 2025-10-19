import { createFileRoute } from "@tanstack/react-router";
import { getAuthToken } from "@/lib/helpers/auth";
import { Outlet, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { NavBottom } from "@/components/nav-buttom";
import { useBackButton } from "@/lib/helpers/handle-back-button";
import { useState } from "react";
import { ExitAppDialog } from "@/components/user-confirmations/exit-app-dialog";

export const Route = createFileRoute("/app")({
 
  component: LayoutComponent,
});

function LayoutComponent() {
  const [deviceHeight] = useState(window.innerHeight);
  const { showExitDialog, onConfirmExit, onCancelExit } = useBackButton(true);
  return (
    <div>
      <AppHeader />
      <main
        className="max-w-3xl mx-auto px-4 py-6 bg-gray-200"
        style={{ height: `${deviceHeight - 140}px` }}
      >
        <Outlet />
      </main>
      <NavBottom />
      <ExitAppDialog
        open={showExitDialog}
        onConfirm={onConfirmExit}
        onCancel={onCancelExit}
      />
    </div>
  );
}

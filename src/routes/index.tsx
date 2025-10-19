import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/forms/login-form";
import { SignupForm } from "@/components/forms/signup-form";
import { Button } from "@/components/ui/button";
import { useBackButton } from "@/lib/helpers/handle-back-button";
import { ExitAppDialog } from "@/components/user-confirmations/exit-app-dialog";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [hasAccount, setHasAccount] = useState(true);
  const { showExitDialog, onConfirmExit, onCancelExit } = useBackButton(true);


  return (
    <div className="flex flex-col items-center justify-center  px-4 min-h-screen bg-gray-100">
      <ExitAppDialog
        open={showExitDialog}
        onConfirm={onConfirmExit}
        onCancel={onCancelExit}
      />
      <div className=" flex flex-col items-center w-full">
        <div className="flex items-center justify-center gap-2 ">
          <Button
            variant={!hasAccount ? "outline" : undefined}
            className="mb-4 w-full"
            onClick={() => {
              setHasAccount(true);
            }}
          >
            Login
          </Button>
          <Button
            variant={hasAccount ? "outline" : undefined}
            className="mb-4 w-full"
            onClick={() => {
              setHasAccount(false);
            }}
          >
            Sign up
          </Button>
        </div>

        <div className="flex overflow-hidden w-full max-w-md">
          <div
            className={`w-full flex-shrink-0 transition-transform duration-500 ${
              !hasAccount ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <LoginForm isSwitchForm={!hasAccount} />
          </div>
          <div
            className={`w-full rounded-sm flex-shrink-0 transition-transform duration-500 ${
              !hasAccount ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <SignupForm isSwitchForm={hasAccount} />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "@/components/pages/settings";

export const Route = createFileRoute("/_home/setting")({
  component: SettingsComponent,
});

function SettingsComponent() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function confirmLogout() {
    setIsDialogOpen(false);
    navigate({ to: "/" });
  }

  return (
    <>
      {/* Your Settings component triggers the dialog */}
      <Settings onLogout={() => setIsDialogOpen(true)} />

      {/* Confirmation dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="rounded-sm" variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="rounded-sm" onClick={confirmLogout} variant="destructive">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

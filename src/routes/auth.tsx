import useBackButton from "@/lib/helpers/handle-back-button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

function RouteComponent() {
  useBackButton(true);

  return <div>Hello "/auth"!</div>;
}

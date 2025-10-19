import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/profile"!</div>
}

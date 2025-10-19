import { Calendar, ChartColumnBig, House, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveTabStore } from "@/stores/active-tab-store";
import { useNavigate } from "@tanstack/react-router";

export function NavBottom() {
  const { activeTab, setActiveTab } = useActiveTabStore();
  const navigate = useNavigate();

  const navItems = [
    { tab: "home", href: "/app/home", label: "Home", icon: House },
    {
      tab: "dashboard",
      href: "/app/dashboard",
      label: "Dashboard",
      icon: ChartColumnBig,
    },
    { tab: "add-task", href: "/app/add-task", label: "Add Task", icon: Plus },
    {
      tab: "calendar",
      href: "/app/calendar",
      label: "Calendar",
      icon: Calendar,
    },
    { tab: "setting", href: "/app/setting", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-md rounded-t-3xl mx-1">
      <nav className="flex justify-around max-w-md mx-auto py-2 mb-3">
        {navItems.map(({ tab, href, label, icon: Icon }) => {
          const isActive = activeTab === tab;
          const isAddTask = href === "/app/add-task";

          return (
            <div key={tab}>
              <Button
                key={href}
                variant={isAddTask ? undefined : "ghost"}
                size={isAddTask ? undefined : "lg"}
                onClick={() => {
                  setActiveTab(tab);
                  navigate({ to: href });
                }}
                aria-label={label}
                className={
                  isAddTask
                    ? "p-0 rounded-full bg-gray-800 shadow-lg flex items-center justify-center w-14 h-14 -mt-6 text-white hover:brightness-110 transition"
                    : "p-0 flex items-center justify-center text-center"
                }
              >
                <Icon
                  className={
                    isAddTask
                      ? "!h-7 !w-7"
                      : `!h-7 !w-7 ${isActive ? "text-gray-900" : "text-gray-500"}`
                  }
                />
              </Button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

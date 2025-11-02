import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PanelLeftClose, PanelRightClose } from "lucide-react";

type ComponentInfo = {
  id?: string;
  name?: string;
  type?: string;
  x?: number;
  y?: number;
  description?: string;
};

type Props = {
  showElementInfos: boolean;
  setshowElementInfos?: (value: boolean) => void;
  selectedComponent?: ComponentInfo | null;
};

const mockComponents = {
  id: "dev-001",
  name: "Water Meter 01",
  type: "Sensor",
  x: 123.45,
  y: 278.12,
  description: "Monitors the water level in Tank A",
};

export function PanelComponentDetails({
  showElementInfos,
  setshowElementInfos,
  selectedComponent = mockComponents,
}: Props) {
  return (
    <div className="relative flex w-full flex-col">
      {/* Toggle Button */}
      <div
        onClick={() => setshowElementInfos?.(!showElementInfos)}
        className="absolute -left-[25px] top-8 z-50 flex rounded-l-sm bg-primary p-[5px] cursor-pointer hover:bg-primary/80 transition"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="grid place-items-center text-white h-5 w-4">
                {showElementInfos ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{showElementInfos ? "Hide Info" : "Show Info"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Information Panel */}
      <Card className="rounded-none border-0 shadow-none p-0 bg-card/70 backdrop-blur-sm">
        <ScrollArea className="h-screen px-3 py-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Component Details
          </div>

          {selectedComponent ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-col border-b pb-2">
                <span className="text-muted-foreground text-xs">Name</span>
                <span className="font-medium">{selectedComponent.name}</span>
              </div>
              <div className="flex flex-col border-b pb-2">
                <span className="text-muted-foreground text-xs">Type</span>
                <span className="font-medium">{selectedComponent.type}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground text-xs">
                  X Position
                </span>
                <span className="font-medium">
                  {selectedComponent.x?.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground text-xs">
                  Y Position
                </span>
                <span className="font-medium">
                  {selectedComponent.y?.toFixed(2)}
                </span>
              </div>
              {selectedComponent.description && (
                <div className="flex flex-col border-b pb-2">
                  <span className="text-muted-foreground text-xs">
                    Description
                  </span>
                  <span className="font-medium">
                    {selectedComponent.description}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No component selected.
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}

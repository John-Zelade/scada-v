import { createFileRoute } from "@tanstack/react-router";
import { SCADAMap } from "@/components/scada/scada-map";
import {
  Save,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Settings,
  Pencil,
  SquarePen,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PanelComponents } from "@/components/panel-components";
import { PanelComponentDetails } from "@/components/panel-details";
import type { ShapesType } from "@/components/types/map";
import { Elements } from "@/lib/mock-data/mock-data";
export const Route = createFileRoute("/_home/home")({
  component: home,
});

export function home() {
  const [isModify, setIsModify] = useState(false);
  const [showElements, setshowElements] = useState(true);
  const [showElementInfos, setshowElementInfos] = useState(true);

  /* Elements stats */
  const [elements, setElements] = useState<ShapesType>(Elements);
  const [modifiedElements, setModifiedElements] = useState<ShapesType[]>([
    Elements,
  ]);

  const toggleshowElements = () => {
    setshowElements((prev) => !prev);
  };

  const toggleshowElementInfos = () => {
    setshowElementInfos((prev) => !prev);
  };

  const setMargin = () => {
    if (!isModify) return "";
    if (showElements && showElementInfos) return "ml-[20%] mr-[20%]";
    if (showElements) return "ml-[20%]";
    if (showElementInfos) return "mr-[20%]";
    return "";
  };

  return (
    <>
      <main className="h-screen">
        {isModify && (
          <>
            <div
              className={`fixed left-0 top-0 z-[1] !mt-0 h-full w-[20%] transform gap-4 border-r shadow-lg transition-transform duration-500 ${
                showElements ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <PanelComponents
                modifiedShapes={modifiedElements}
                setModifiedShapes={setModifiedElements}
                shapes={elements}
                setShapes={setElements}
                isModify={isModify}
                setshowElements={toggleshowElements}
                showElements={showElements}
              />
            </div>
          </>
        )}
        {isModify && (
          <>
            <div
              className={`fixed right-0 top-0 z-[1] !mt-0 h-full w-[20%] transform gap-4 border-l shadow-lg transition-transform duration-500 ${
                showElementInfos ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <PanelComponentDetails
                setshowElementInfos={toggleshowElementInfos}
                showElementInfos={showElementInfos}
              />
            </div>
          </>
        )}

        <div className={`relative h-full w-full transition-all duration-500`}>
          <div className="flex flex-col rounded-xl h-full border-0 shadow-none pb-2">
            <div
              className={`relative !mt-0 flex-1 transition-all duration-500 ${setMargin()}`}
            >
              <CardContent className="relative flex items-center justify-between px-2 mb-3">
                <div
                  className={`${!isModify && `hidden`} flex items-center gap-1`}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-pointer" asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Save className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger className="cursor-pointer" asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Undo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger className="cursor-pointer" asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Redo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger className="cursor-pointer" asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom In</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger className="cursor-pointer" asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom Out</TooltipContent>
                    </Tooltip>

                    {/* <Tooltip>
                    <TooltipTrigger className="cursor-pointer" asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export Layout</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger className="cursor-pointer" asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Import Layout</TooltipContent>
                  </Tooltip> */}

                    <Tooltip>
                      <TooltipTrigger className="cursor-pointer" asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Settings</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div>
                  <Tooltip>
                    <TooltipTrigger className="cursor-pointer" asChild>
                      <Button
                        variant={"ghost"}
                        className={`h-8 w-8`}
                        onClick={() => setIsModify(!isModify)}
                      >
                        {isModify ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <SquarePen className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{`${isModify ? `Cancel` : `Edit/Update`}`}</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </div>

            <CardContent className="relative h-full px-2">
              <div className="h-full w-full overflow-hidden border">
                <SCADAMap
                  isModify={isModify}
                  showElements={showElements}
                  modifiedShapes={modifiedElements}
                  setModifiedShapes={setModifiedElements}
                  shapes={elements}
                  setShapes={setElements}
                />
              </div>
            </CardContent>
          </div>
        </div>
      </main>
    </>
  );
}

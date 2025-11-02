import { createFileRoute } from "@tanstack/react-router";
import { SCADAMap } from "@/components/scada/scada-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PanelComponents } from "@/components/panel-components";
export const Route = createFileRoute("/_home/home")({
  component: home,
});

export function home() {
  const [isModify, setIsModify] = useState(false);
  const [showElements, setshowElements] = useState(true);

  const toggleshowElements = () => {
    setshowElements((prev) => !prev);
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
                setshowElements={toggleshowElements}
                showElements={showElements}
              />
            </div>
          </>
        )}

        <div className={`relative h-full w-full transition-all duration-500`}>
          <div className="flex flex-col rounded-xl h-full border-0 shadow-none py-2">
            <CardContent className="relative flex justify-end px-2 mb-2">
              <Button
                className={`${isModify ? "bg-gray-500" : ""} cursor-pointer`}
                onClick={() => {
                  setIsModify(!isModify);
                }}
              >
                Modify
              </Button>
            </CardContent>
            <CardContent className="relative h-full px-2">
              <div className="h-full w-full overflow-hidden border">
                <SCADAMap isModify={isModify} showElements={showElements} />
              </div>
            </CardContent>
          </div>
        </div>
      </main>
    </>
  );
}

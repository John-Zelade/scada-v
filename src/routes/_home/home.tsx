import { createFileRoute } from "@tanstack/react-router";
import { SCADAMap } from "@/components/scada/scada-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export const Route = createFileRoute("/_home/home")({
  component: home,
});

export function home() {
  const [isModify, setIsModify] = useState(false);
  return (
    <>
      <main className="h-screen">
        <div className={`!m-0 max-w-full container relative flex h-screen`}>
          <Card className="flex h-full w-full flex-col border-0 shadow-none py-2 ">
            <CardHeader className="flex justify-center px-2">
              {/*  <CardTitle>SCADA-V</CardTitle> */}
            </CardHeader>
            <CardContent className="relativepx-2 pb-0">
              <Button
                className={`${isModify ? "bg-gray-500" : ""} cursor-pointer`}
                onClick={() => {
                  setIsModify(!isModify);
                }}
              >
                Modify
              </Button>
            </CardContent>
            <CardContent className="relative h-screen w-full px-2">
              <div className="h-full w-full overflow-hidden border">
                <SCADAMap isModify={isModify} />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

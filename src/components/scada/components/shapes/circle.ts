import type {
  SelectedComponent,
  Shape,
  ShapesType,
} from "@/components/types/map";
import * as d3 from "d3";
import { createDragHandlers } from "../../util";

export function drawCircle(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  shapes: ShapesType,
  setShapes: React.Dispatch<React.SetStateAction<ShapesType>>,
  svgWidth: number,
  svgHeight: number,

  isModify: boolean = false,

  selectedComponents: SelectedComponent[],
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >
) {
  console.log(`Circle: `, shapes.circle);

  //Clear old circles before re-drawing
  svg.selectAll(".circle-group").remove();

  shapes.circle.forEach((circle) => {
    //get parent g under svg
    const g = svg.select(`.zoom-layer`);

    //create circle group each circle
    const circleGroup = g
      .append(`g`)
      .attr(`class`, `circle-group circle-${circle.id}`);

    //get current position
    const posX = (circle.points[0].x / 100) * svgWidth;
    const posY = (circle.points[0].y / 100) * svgHeight;

    const radius = Math.min(svgWidth, svgHeight) * 0.025;

    const _circle = circleGroup
      .append("circle")
      .datum(circle)
      .attr("cx", posX)
      .attr("cy", posY)
      .attr("r", radius) // ✅ you need a radius for visibility
      .attr("fill", "#ffffff9d") // ✅ add fill or stroke
      .attr("stroke", "#2b2c2cff")
      .attr("stroke-width", 0.5)
      .style("cursor", isModify ? "move" : "pointer");

    // Label for the circle
    circleGroup
      .append("text")
      .attr("x", posX )
      .attr("y", posY - 15)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#000")
      .text(circle.id);

    // Enable drag if modification mode is on
    if (isModify) {
      const drag = createDragHandlers<SVGCircleElement, Shape>(
        svg,
        (d) => d.points[0], // ✅ returns current x/y position
        (d, x, y) => ({
          ...d,
          points: [{ x, y }, ...d.points.slice(1)], // ✅ updates the first point
        }),
        (
          id,
          updated // ✅ correct setter usage
        ) =>
          setShapes((prev) => ({
            ...prev,
            circle: prev.circle.map((c) => (c.id === id ? updated : c)),
          })),
        svgWidth,
        svgHeight
      );

      _circle.call(drag); // ✅ attach drag behavior to circle
    }
  });
}

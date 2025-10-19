interface DrawParams {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  dimensions: { width: number; height: number };
}


export function scadaDraw({ canvas, ctx, dimensions }: DrawParams) {
  const { width: w, height: h } = dimensions;

  if (!canvas || !ctx) return;

  canvas.width = w;
  canvas.height = h;

  
}

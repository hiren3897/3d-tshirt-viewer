// decalUtils.ts

// Mapping from side to 3D origin for printable region
export const sideOrigins: Record<string, [number, number, number]> = {
  front: [0.09, 1.04, 0.1],
  back: [0.09, 1.34, -0.1],
  left_sleeve: [-0.3, 1.2, 0.0], // adjust after visual debugging
  right_sleeve: [0.3, 1.2, 0.0], // adjust after visual debugging
};

// These should be derived from your 2D guide overlay measurements
export const printablePixelWidth = 610; // e.g. guide overlay image width
export const printablePixelHeight = 710; // guide image height
export const printable3DWidth = 0.28; // in meters (tshirt front width)
export const printable3DHeight = 0.33; // height of printable zone

export const mappingScaleX = printablePixelWidth / printable3DWidth;
export const mappingScaleY = -printablePixelHeight / printable3DHeight; // negative to flip Y

export function convert3Dto2D(
  pos3D: [number, number, number],
  side: string,
  guideWidth: number,
  guideHeight: number
) {
  const [orgX, orgY, _orgZ] = sideOrigins[side];
  const dx = pos3D[0] - orgX;
  const dy = pos3D[1] - orgY;
  const x = dx * mappingScaleX + guideWidth / 2;
  const y = dy * mappingScaleY + guideHeight / 2;
  return { x, y };
}

export function convert2Dto3D(
  x2D: number,
  y2D: number,
  side: string,
  guideWidth: number,
  guideHeight: number
): [number, number, number] {
  const dx = x2D - guideWidth / 2;
  const dy = y2D - guideHeight / 2;
  const [orgX, orgY, orgZ] = sideOrigins[side];
  const x = dx / mappingScaleX + orgX;
  const y = dy / mappingScaleY + orgY;
  const z = orgZ;
  return [x, y, z];
}

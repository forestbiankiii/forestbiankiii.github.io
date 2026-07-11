export const OUTER_SCREEN_EDGE_SIZE = 1;

const SCREEN_INNER_EDGE_RATIO = 0.03;

export function getScreenInnerEdgeSize(distanceToScreenEdge: number) {
  return Math.ceil(distanceToScreenEdge * SCREEN_INNER_EDGE_RATIO);
}

export function getButtonEdgeSize(
  width: number,
  height: number,
  borderWidth: number,
) {
  return Math.min(width, height) * borderWidth * 0.5;
}

export function getEdgeBlur(edgeSize: number) {
  return edgeSize * 3;
}

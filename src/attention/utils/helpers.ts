import { ReferenceElement } from "@floating-ui/core";
import { computePosition, flip, offset, shift, arrow } from "@floating-ui/dom";

const TOP = "top";
const BOTTOM = "bottom";
const LEFT = "left";
const RIGHT = "right";
type Directions = "top" | "right" | "bottom" | "left";

export const opposites = {
  [TOP]: BOTTOM,
  [BOTTOM]: TOP,
  [LEFT]: RIGHT,
  [RIGHT]: LEFT,
};
export const arrowLabels = {
  [TOP]: "↑",
  [BOTTOM]: "↓",
  [LEFT]: "←",
  [RIGHT]: "→",
};
export const directions = [TOP, BOTTOM, LEFT, RIGHT];
export const rotation = {
  [LEFT]: -45,
  [TOP]: 45,
  [RIGHT]: 135,
  [BOTTOM]: -135,
};

export type AttentionState = {
  isShowing?: boolean;
  isCallout?: boolean;
  actualDirection?: Directions;
  directionName: Directions;
  arrowEl?: HTMLElement | null;
  attentionEl?: HTMLElement | null;
  targetEl?: unknown;
  top?: Boolean;
  right?: Boolean;
  bottom?: Boolean;
  left?: Boolean;
  tooltip?: Boolean;
  popover?: Boolean;
  callout?: Boolean;
  noArrow?: Boolean;
  waitForDOM?: () => void;
};

const middlePosition = "calc(50% - 7px)";
const isDirectionVertical = (name: string) => [TOP, BOTTOM].includes(name);
function computeCalloutArrow({
  actualDirection,
  directionName,
  arrowEl,
}: AttentionState) {
  if (!arrowEl) return;

  actualDirection = directionName;
  const directionIsVertical = isDirectionVertical(directionName);
  arrowEl.style.left = directionIsVertical ? middlePosition : "";
  arrowEl.style.top = !directionIsVertical ? middlePosition : "";
}

export async function useRecompute(state: AttentionState) {
  if (!state.isShowing) return; // we're not currently showing the element, no reason to recompute
  await state?.waitForDOM?.(); // wait for DOM to settle before computing
  if (state.isCallout) return computeCalloutArrow(state); // we don't move the callout box, only its arrow
  const position = await computePosition(
    state.targetEl as ReferenceElement,
    state.attentionEl as HTMLElement,
    {
      placement: state.directionName,
      middleware: [
        // Should we make this configurable, but have these as sane defaults?
        flip(),
        offset(8),
        shift({ padding: 16 }),
        // @ts-ignore
        arrow({ element: state.noArrow ? undefined : state.arrowEl }), // FIXME
      ],
    }
  );
  // @ts-ignore
  state.actualDirection = position.placement;
  Object.assign(state.attentionEl?.style || {}, {
    left: "0",
    top: "0",
    transform: `translate3d(${Math.round(position.x)}px, ${Math.round(
      position.y
    )}px, 0)`,
  });
  // @ts-ignore
  let { x, y } = position.middlewareData.arrow;

  if (state.arrowEl) {
    state.arrowEl.style.left = x ? x + "px" : "";
    state.arrowEl.style.top = y ? y + "px" : "";
  }
}

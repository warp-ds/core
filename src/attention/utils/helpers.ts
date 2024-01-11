import { computePosition, flip, offset, shift, arrow, ReferenceElement } from "@floating-ui/dom";

const TOPSTART = "top-start";
const TOP = "top";
const TOPEND = "top-end";
const RIGHTSTART = "right-start";
const RIGHT = "right";
const RIGHTEND ="right-end";
const BOTTOMSTART = "bottom-start";
const BOTTOM = "bottom";
const BOTTOMEND = "bottom-end"
const LEFTSTART = "left-start";
const LEFT = "left";
const LEFTEND = "left-end";

type Directions =   | 'top'
| 'top-start'
| 'top-end'
| 'right'
| 'right-start'
| 'right-end'
| 'bottom'
| 'bottom-start'
| 'bottom-end'
| 'left'
| 'left-start'
| 'left-end';

export const opposites = {
  [TOPSTART]: BOTTOMSTART,
  [TOP]: BOTTOM,
  [TOPEND]: BOTTOMEND,
  [BOTTOMSTART]: TOPSTART,
  [BOTTOM]: TOP,
  [BOTTOMEND]: TOPEND,
  [LEFTSTART]: RIGHTSTART,
  [LEFT]: RIGHT,
  [LEFTEND]: RIGHTEND,
  [RIGHTSTART]: LEFTSTART,
  [RIGHT]: LEFT,
  [RIGHTEND]: LEFTEND,
};
export const arrowLabels = {
  [TOPSTART]: "↑",
  [TOP]: "↑",
  [TOPEND]: "↑",
  [BOTTOMSTART]: "↓",
  [BOTTOM]: "↓",
  [BOTTOMEND]: "↓",
  [LEFTSTART]: "←",
  [LEFT]: "←",
  [LEFTEND]: "←",
  [RIGHTSTART]: "→",
  [RIGHT]: "→",
  [RIGHTEND]: "→",

};
export const directions = [TOPSTART, TOP, TOPEND, BOTTOMSTART, BOTTOM, BOTTOMEND, LEFTSTART, LEFT, LEFTEND, RIGHTSTART, RIGHT, RIGHTEND];
export const rotation = {
  [LEFTSTART]: -45,
  [LEFT]: -45,
  [LEFTEND]: -45,
  [TOPSTART]: 45,
  [TOP]: 45,
  [TOPEND]: 45,
  [RIGHTSTART]: 135,
  [RIGHT]: 135,
  [RIGHTEND]: 135,
  [BOTTOMSTART]: -135,
  [BOTTOM]: -135,
  [BOTTOMEND]: -135,
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
  state?.waitForDOM?.(); // wait for DOM to settle before computing
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
    left: `${position.x}px`,
    top: `${position.y}px`,
    // transform: `translate3d(${Math.round(position.x)}px, ${Math.round(
    //   position.y
    // )}px, 0)`,
  });
  // @ts-ignore
  let { x, y } = position.middlewareData.arrow;

  if (state.arrowEl) {
    state.arrowEl.style.left = x ? x + "px" : "";
    state.arrowEl.style.top = y ? y + "px" : "";
  }
}

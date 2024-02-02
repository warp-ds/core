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
  waitForDOM?: () => void;
};

const middlePosition = "calc(50% - 7px)";
const isDirectionVertical = (name: string) => [TOPSTART, TOP, TOPEND, BOTTOMSTART, BOTTOM, BOTTOMEND].includes(name);
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

export async function useRecompute (state: AttentionState, update: () => void) {
    if (!state.isShowing)  return // we're not currently showing the element, no reason to recompute
    // @ts-ignore
    await state?.waitForDOM; // wait for DOM to settle before computing
      if (state.isCallout) return computeCalloutArrow(state); // we don't move the callout box
      update()
}

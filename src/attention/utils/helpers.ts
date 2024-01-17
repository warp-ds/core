import { autoUpdate, computePosition, flip, offset, shift, arrow, ReferenceElement } from "@floating-ui/dom";

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
  targetEl?: ReferenceElement | null;
  topStart?: Boolean; 
  top?: Boolean;
  topEnd?: Boolean;
  rightStart?: Boolean;
  right?: Boolean;
  rightEnd?: Boolean;
  bottomStart?: Boolean;
  bottom?: Boolean;
  bottomEnd?: Boolean;
  leftStart?: Boolean;
  left?: Boolean;
  leftEnd?: Boolean;
  tooltip?: Boolean;
  popover?: Boolean;
  callout?: Boolean;
  noArrow?: Boolean;
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

export async function useRecompute(state: AttentionState) {
  if (!state.isShowing) return; // we're not currently showing the element, no reason to recompute
  state?.waitForDOM?.(); // wait for DOM to settle before computing
  if (state.isCallout) return computeCalloutArrow(state); // we don't move the callout box
  const arrowOffsetWidth = state.arrowEl ? state.arrowEl.offsetWidth : 0;
  const floatingOffset = state.arrowEl ? Math.sqrt(2 * arrowOffsetWidth ** 2)/ 2 : 8;
  const cleanup = async () => {
    const position = await computePosition(
      state.targetEl as ReferenceElement,
      state.attentionEl as HTMLElement,
      {
        placement: state.directionName,
        middleware: [
          offset(floatingOffset),
          flip(),
          shift({ padding: 16 }),
          state.arrowEl && arrow({ element: state.arrowEl }),
        ],
      }
    );
    // @ts-ignore
    state.actualDirection = position.placement;
    Object.assign(state.attentionEl?.style || {}, {
      left: `${position.x}px`,
      top: `${position.y}px`,
    });

    const side = position.placement.split("-")[0];
    
    const staticSide: string | any = {
      top: "bottom",
      right: "left",
      bottom: "top",
      left: "right"
    }[side];
    console.log("staticSide: ", staticSide);
    

    if (position.middlewareData.arrow) {
      // @ts-ignore
      let { x, y } = position.middlewareData.arrow;  
      Object.assign(state.arrowEl?.style || {}, {
        left: x !== null ? `${x}px` : "",
        top: y !== null ? `${y}px` : "",
        // Ensure the static side gets unset when
        // flipping to other placements' axes.
        right: "",
        bottom: "",
        [staticSide]: `${-arrowOffsetWidth / 2}px`,
      });
    }
  }
  // computePosition() only positions state.attentionEl once. To ensure it remains anchored to the state.targetEl during a variety of scenarios, for example, when resizing or scrolling, we need to wrap the calculation in autoUpdate:
  autoUpdate(state.targetEl as ReferenceElement, state.attentionEl as HTMLElement, cleanup)
}
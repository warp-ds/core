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
  targetEl?: unknown;
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
  let isMounted = true;
  if (state.isShowing === true || state.isCallout) {
    state?.waitForDOM?.(); // wait for DOM to settle before computing
    if (state.isCallout) return computeCalloutArrow(state); // we don't move the callout box
    const referenceEl = state.targetEl as ReferenceElement
    const floatingEl = state.attentionEl as HTMLElement
    const arrowEl = state.arrowEl as HTMLElement
    const floatingOffset = arrowEl ? Math.sqrt(2 * arrowEl.offsetWidth ** 2)/ 2 : 8;
  
    if (isMounted) {
      const update = async () => {
        const position = await computePosition(
          referenceEl,
          floatingEl,
          {
            placement: state.directionName,
            middleware: [
              offset(floatingOffset),
              flip(),
              shift({ padding: 16 }),
              arrowEl && arrow({ element: arrowEl }),
            ],
          }
        );
        // @ts-ignore
        state.actualDirection = position.placement;
        Object.assign(state.attentionEl?.style || {}, {
          left: `${position.x}px`,
          top: `${position.y}px`,
        });

        if (position.middlewareData.arrow) {
          // @ts-ignore
          let { x, y } = position.middlewareData.arrow;  


          Object.assign(arrowEl?.style || {}, {
            left: x ? `${x}px` : "",
            // TODO: temporary fix, for some reason left-start and right-start positions the arrowEL slightly too far from the attentionEl
            top: y ? position.placement.includes("-start") ? `${y - 4}px` : `${y}px` : "",
          });
        }
      }
      // computePosition() only positions state.attentionEl once. To ensure it remains anchored to the state.targetEl during a variety of scenarios, for example, when resizing or scrolling, we need to wrap the calculation in autoUpdate:
      autoUpdate(referenceEl, floatingEl, update)
    }
  }
    return () => {
      isMounted = false;
    }
}
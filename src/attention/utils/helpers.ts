import { computePosition, flip, offset, arrow, autoUpdate, ReferenceElement, hide, shift } from '@floating-ui/dom';

export type Directions =
  | 'top'
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

const TOP_START: Directions = 'top-start';
const TOP: Directions = 'top';
const TOP_END: Directions = 'top-end';
const RIGHT_START: Directions = 'right-start';
const RIGHT: Directions = 'right';
const RIGHT_END: Directions = 'right-end';
const BOTTOM_START: Directions = 'bottom-start';
const BOTTOM: Directions = 'bottom';
const BOTTOM_END: Directions = 'bottom-end';
const LEFT_START: Directions = 'left-start';
const LEFT: Directions = 'left';
const LEFT_END: Directions = 'left-end';

export const directions: Directions[] = [
  TOP_START,
  TOP,
  TOP_END,
  RIGHT_START,
  RIGHT,
  RIGHT_END,
  BOTTOM_START,
  BOTTOM,
  BOTTOM_END,
  LEFT_START,
  LEFT,
  LEFT_END,
];

export const opposites: Record<Directions, Directions> = {
  [TOP_START]: BOTTOM_START,
  [TOP]: BOTTOM,
  [TOP_END]: BOTTOM_END,
  [BOTTOM_START]: TOP_START,
  [BOTTOM]: TOP,
  [BOTTOM_END]: TOP_END,
  [LEFT_START]: RIGHT_START,
  [LEFT]: RIGHT,
  [LEFT_END]: RIGHT_END,
  [RIGHT_START]: LEFT_START,
  [RIGHT]: LEFT,
  [RIGHT_END]: LEFT_END,
};

const rotation: Record<Directions, number> = {
  [LEFT_START]: -45,
  [LEFT]: -45,
  [LEFT_END]: -45,
  [TOP_START]: 45,
  [TOP]: 45,
  [TOP_END]: 45,
  [RIGHT_START]: 135,
  [RIGHT]: 135,
  [RIGHT_END]: 135,
  [BOTTOM_START]: -135,
  [BOTTOM]: -135,
  [BOTTOM_END]: -135,
};

export type AttentionState = {
  isShowing?: boolean;
  isCallout?: boolean;
  actualDirection?: Directions;
  directionName?: Directions;
  arrowEl?: HTMLElement | null;
  attentionEl?: HTMLElement | null;
  flip?: Boolean;
  crossAxis?: boolean;
  fallbackPlacements?: Directions[];
  targetEl?: ReferenceElement | null;
  noArrow?: Boolean;
  distance?: number;
  skidding?: number;
  waitForDOM?: () => void;
};

export const arrowDirectionClassname = (dir: Directions) => {
  let direction: Directions;
  if (/-/.test(dir)) {
    direction = dir
      .split('-')
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
      .join('') as Directions;
  } else {
    direction = (dir.charAt(0).toUpperCase() + dir.slice(1)) as Directions;
  }
  return direction;
};

const side = (dir: Directions): Directions => dir.split('-')[0] as Directions;
const staticSide = (dir: Directions): Directions => opposites[side(dir)];
const arrowDirection = (dir: Directions): Directions => opposites[dir];
const arrowRotation = (dir: Directions): number => rotation[arrowDirection(dir)];

const applyArrowStyles = (arrowEl: HTMLElement, arrowRotation: number, dir: Directions) => {
  Object.assign(arrowEl?.style, {
    borderTopLeftRadius: '4px',
    zIndex: 1,
    // border alignment is off by a fraction of a pixel, this fixes it
    [`margin${arrowDirectionClassname(staticSide(dir))}`]: '-0.5px',
    transform: `rotate(${arrowRotation}deg)`,
  });
};

export async function useRecompute(state: AttentionState) {
  if (!state?.isShowing) return; // we're not currently showing the element, no reason to recompute
  if (state?.waitForDOM) {
    await state?.waitForDOM(); // wait for DOM to settle before computing
  }
  if (!state?.targetEl || !state?.attentionEl) return;

  let targetEl: ReferenceElement = state?.targetEl;
  const attentionEl: HTMLElement = state.attentionEl;

  computePosition(targetEl, attentionEl, {
    placement: state?.directionName ?? BOTTOM,
    middleware: [
      offset({ mainAxis: state?.distance ?? 8, crossAxis: state?.skidding ?? 0 }), // offers flexibility over how to place the attentionEl towards its targetEl both on the x and y axis (horizontally and vertically).
      state?.flip &&
        flip({
          // when flip is set to true it will move the attentionEl's placement to its opposite side or to the preferred placements if fallbackPlacements has a value
          crossAxis: state?.crossAxis, // checks overflow to trigger a flip. When disabled, it will ignore overflow
          fallbackPlacements: state?.fallbackPlacements,
        }),
      !state?.noArrow && state?.arrowEl && arrow({ element: state?.arrowEl }),
      state?.flip && shift((shiftState) => ({ crossAxis: true, padding: shiftState.rects.reference.width * 0.1 })),
      hide(), // will hide the attentionEl when it appears detached from the targetEl. Can be called multiple times in the middleware-array if you want to use several strategies. Default strategy is 'referenceHidden'.
    ],
  }).then(({ x, y, middlewareData, placement }) => {
    state.actualDirection = placement;

    // We only want floating-ui to calculate the callout's arrow position and not the attention element's position, since the targetEl can be undefined if isCallout is true.
    // Therefore, we only add this style to the attentionEl when isCallout is false.
    if (!state?.isCallout) {
      Object.assign(attentionEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    }

    if (middlewareData?.hide && !state?.isCallout) {
      const { referenceHidden } = middlewareData.hide;
      Object.assign(attentionEl.style, {
        visibility: referenceHidden ? 'hidden' : '',
      });
    }

    if (middlewareData?.arrow && state?.arrowEl) {
      const arrowEl: HTMLElement = state?.arrowEl as HTMLElement;
      const { x: arrowX, y: arrowY } = middlewareData.arrow;
      const { x: shiftX } = middlewareData.shift || {}; // Get the shift value if it exists

      // Adjust the arrow based on the cross-axis shift
      let left = typeof arrowX === 'number' ? `${arrowX - (shiftX || 0)}px` : '';
      let top = typeof arrowY === 'number' ? `${arrowY}px` : '';

      Object.assign(arrowEl.style, {
        left,
        top,
      });
      applyArrowStyles(arrowEl, arrowRotation(placement), placement);
    }
  });

  return state;
}

export const autoUpdatePosition = (state: AttentionState) => {
  // computePosition is only run once, so we need to wrap autoUpdate() around useRecompute() in order to recompute the attentionEl's position
  // autoUpdate adds event listeners that are triggered on resize and on scroll and will keep calling the useRecompute().
  // autoUpdate returns a cleanup() function that removes the event listeners.
  if (!state?.targetEl || !state?.attentionEl || state?.isCallout) return;
  return autoUpdate(state?.targetEl, state?.attentionEl, () => {
    useRecompute(state);
  });
};

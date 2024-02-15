import {
  computePosition,
  flip,
  offset,
  shift,
  arrow,
  autoUpdate,
  ReferenceElement,
} from '@floating-ui/dom'

const TOPSTART = 'top-start'
const TOP = 'top'
const TOPEND = 'top-end'
const RIGHTSTART = 'right-start'
const RIGHT = 'right'
const RIGHTEND = 'right-end'
const BOTTOMSTART = 'bottom-start'
const BOTTOM = 'bottom'
const BOTTOMEND = 'bottom-end'
const LEFTSTART = 'left-start'
const LEFT = 'left'
const LEFTEND = 'left-end'

type Directions =
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
  | 'left-end'

type FallbackDirection = 'none' | 'start' | 'end'

export const opposites = {
  [TOPSTART]: BOTTOMEND,
  [TOP]: BOTTOM,
  [TOPEND]: BOTTOMSTART,
  [BOTTOMSTART]: TOPEND,
  [BOTTOM]: TOP,
  [BOTTOMEND]: TOPSTART,
  [LEFTSTART]: RIGHTEND,
  [LEFT]: RIGHT,
  [LEFTEND]: RIGHTSTART,
  [RIGHTSTART]: LEFTEND,
  [RIGHT]: LEFT,
  [RIGHTEND]: LEFTSTART,
}

export const arrowLabels = {
  [TOPSTART]: '↑',
  [TOP]: '↑',
  [TOPEND]: '↑',
  [BOTTOMSTART]: '↓',
  [BOTTOM]: '↓',
  [BOTTOMEND]: '↓',
  [LEFTSTART]: '←',
  [LEFT]: '←',
  [LEFTEND]: '←',
  [RIGHTSTART]: '→',
  [RIGHT]: '→',
  [RIGHTEND]: '→',
}
export const directions = [
  TOPSTART,
  TOP,
  TOPEND,
  BOTTOMSTART,
  BOTTOM,
  BOTTOMEND,
  LEFTSTART,
  LEFT,
  LEFTEND,
  RIGHTSTART,
  RIGHT,
  RIGHTEND,
]
export const rotation: any = {
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
}

export type AttentionState = {
  isShowing?: boolean
  isCallout?: boolean
  actualDirection?: Directions
  directionName: Directions
  arrowEl?: HTMLElement | null
  attentionEl?: HTMLElement | null
  fallbackDirection?: FallbackDirection
  targetEl?: unknown
  tooltip?: Boolean
  popover?: Boolean
  callout?: Boolean
  highlight?: Boolean
  noArrow?: Boolean
  distance?: number
  skidding?: number
  waitForDOM?: () => void
}

const middlePosition = 'calc(50% - 7px)'
const isDirectionVertical = (name: string) =>
  [TOPSTART, TOP, TOPEND, BOTTOMSTART, BOTTOM, BOTTOMEND].includes(name)

function computeCalloutArrow({
  actualDirection,
  directionName,
  arrowEl,
}: AttentionState) {
  if (!arrowEl) return

  actualDirection = directionName

  const arrowDirection = opposites[actualDirection]
  const arrowRotation = rotation[arrowDirection]

  const directionIsVertical = isDirectionVertical(directionName)
  arrowEl.style.left = directionIsVertical ? middlePosition : ''
  arrowEl.style.top = !directionIsVertical ? middlePosition : ''
  arrowEl.style.transform = `rotate(${arrowRotation}deg)`
}

// export function observer(isShowing)

export async function useRecompute(state: AttentionState) {
  if (!state?.isShowing) return // we're not currently showing the element, no reason to recompute
  if (state?.waitForDOM) {
    await state?.waitForDOM() // wait for DOM to settle before computing
  }
  if (state?.isCallout) {
    return computeCalloutArrow(state)
  }

  const referenceEl: ReferenceElement = state?.targetEl as ReferenceElement
  const floatingEl: HTMLElement = state?.attentionEl as unknown as HTMLElement
  const arrowEl: HTMLElement = state?.arrowEl as unknown as HTMLElement

  if (!referenceEl || !floatingEl) return

  // We stop computing the position of the floatingEl when referenceEl is no longer in view:
  const observer: IntersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (state?.isShowing && !entry.isIntersecting) {
        state.isShowing = false
        console.log("state.isShowing: ", state.isShowing);
      }
    }
  })

  const observedElements = new Set<Element>()

  if (referenceEl && !observedElements.has(referenceEl as Element)) {
    observer.observe(referenceEl as Element)
    observedElements.add(referenceEl as Element)
  }
  if (!state.isShowing) {
    observer.unobserve(referenceEl as Element)
    console.log("kommer vi hit?");
    
    observedElements.delete(referenceEl as Element)
    return
  }
  
  
  computePosition(referenceEl, floatingEl, {
    placement: state?.directionName,
    middleware: [
      offset({ mainAxis: state?.distance, crossAxis: state?.skidding }),
      flip({
        fallbackAxisSideDirection: 'start',
        fallbackStrategy: 'initialPlacement',
      }),
      shift({ padding: 16 }),
      !state?.noArrow && arrowEl && arrow({ element: arrowEl }),
    ],
  }).then(({ x, y, middlewareData, placement }) => {
    state.actualDirection = placement
    console.log('state?.actualDirection: ', state?.actualDirection)

    Object.assign(floatingEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    })

    const side = placement.split('-')[0]

    const staticSide: any = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[side]

    const isRtl = window.getComputedStyle(floatingEl).direction === 'rtl'
    const arrowDirection: any = opposites[placement]
    const arrowPlacement: any = arrowDirection.split('-')[1]
    const arrowRotation: any = rotation[arrowDirection]

    if (middlewareData.arrow) {
      const { x, y } = middlewareData.arrow
      let top = ''
      let right = ''
      let bottom = ''
      let left = ''

      if (arrowPlacement === 'start') {
        const value =
          typeof x === 'number'
            ? `calc(10px - ${arrowEl?.offsetWidth / 2}px)`
            : ''
        top =
          typeof y === 'number'
            ? `calc(10px -  ${arrowEl?.offsetWidth / 2}px)`
            : ''
        right = isRtl ? value : ''
        left = isRtl ? '' : value
      } else if (arrowPlacement === 'end') {
        const value =
          typeof x === 'number'
            ? `calc(10px - ${arrowEl?.offsetWidth / 2}px)`
            : ''
        right = isRtl ? '' : value
        left = isRtl ? value : ''
        bottom =
          typeof y === 'number'
            ? `calc(10px - ${arrowEl?.offsetWidth / 2}px)`
            : ''
      } else {
        left = typeof x === 'number' ? `${x}px` : ''
        top = typeof y === 'number' ? `${y}px` : ''
      }

      Object.assign(arrowEl?.style || {}, {
        top,
        right,
        bottom,
        left,
        [staticSide]: `${-arrowEl?.offsetWidth / 2}px`,
        transform: `rotate(${arrowRotation}deg)`,
      })
    }
  })

  return state
}

export const autoUpdatePosition = (state: AttentionState) => {
  const referenceEl: ReferenceElement = state?.targetEl as ReferenceElement
  const floatingEl: HTMLElement = state?.attentionEl as HTMLElement
  return autoUpdate(referenceEl, floatingEl, () => {
    useRecompute(state)
  })
}

import { validKeyCodes, validKeys, eventOptions, clamp, roundDecimals, ElementType } from './helpers.js';

type ClickEvent = TouchEvent | MouseEvent;

export type Dimensions = {
  left: number;
  width: number;
};

interface SliderProps {
  min: number; // Default 0
  max: number; // Default 100
  step: number;
  disabled?: boolean;
  label?: string;
  labelledBy?: string;
  preventAcceleration?: boolean;
}

interface SliderState {
  dimensions: Dimensions;
  sliderPressed: boolean;
  position: number;
  val: number;
  step: number;
  thumbEl: HTMLDivElement | null;
}

export function createHandlers({ props, sliderState }: { props: SliderProps; sliderState: SliderState }) {
  const clampedChange = (n: number) => clamp(n, { max: props.max, min: props.min });

  function getCoordinates(e: ClickEvent) {
    const { left: offsetLeft, width: trackWidth } = sliderState.dimensions;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    let left = Math.min(Math.max((clientX - offsetLeft - 16) / trackWidth, 0), 1) || 0;
    const value = props.min + left * (props.max - props.min);
    return { value };
  }

  const getThumbPosition = () => ((sliderState.position - props.min) / (props.max - props.min)) * 100;

  const getThumbTransform = () => (getThumbPosition() / 100) * sliderState.dimensions.width;

  const getShiftedChange = (n: number) => {
    const r = 1.0 / sliderState.step;
    return Math.floor(n * r) / r;
  };

  const keydownRepeat = {
    counter: 0,
    repeatsBeforeAcceleration: 3,
  };

  function handleKeyDown(e: KeyboardEvent) {
    const key = e.key as ElementType<typeof validKeyCodes>;

    if (props.disabled || !validKeyCodes.includes(key)) return;
    e.preventDefault();

    switch (key) {
      case validKeys.left:
      case validKeys.right:
      case validKeys.up:
      case validKeys.down: {
        const direction = key === validKeys.right || key === validKeys.up ? 1 : -1;
        let stepsToMove = sliderState.step;
        if (!props.preventAcceleration) {
          if (e.repeat) {
            keydownRepeat.counter++;
            const acceleratedStepPercentage = Math.min((keydownRepeat.counter - keydownRepeat.repeatsBeforeAcceleration) / 100, 0.2);
            stepsToMove = Math.max(
              sliderState.step,
              Math.ceil((direction > 0 ? props.max - sliderState.val : sliderState.val - props.min) * acceleratedStepPercentage),
            );
          } else {
            keydownRepeat.counter = 0;
          }
        }
        sliderState.position = clampedChange(sliderState.val + direction * stepsToMove);
        break;
      }
      case validKeys.home:
        sliderState.position = props.min;
        break;
      case validKeys.end:
        sliderState.position = props.max;
        break;
      case validKeys.pageup:
      case validKeys.pagedown: {
        const direction = key === validKeys.pageup ? 1 : -1;
        const minStepMultiplier = 2;
        const maxStepMultiplier = 50;
        sliderState.position = clampedChange(
          sliderState.val +
            direction *
              sliderState.step *
              Math.max(minStepMultiplier, Math.min(maxStepMultiplier, Math.ceil((props.max - props.min) / 10 / sliderState.step))),
        );
        break;
      }
      default:
        break;
    }
  }

  function handleFocus(): void {}
  function handleBlur(): void {}

  function handleMouseDown(e: KeyboardEvent) {
    sliderState.sliderPressed = true;
    if ('touches' in e) {
      window.addEventListener('touchmove', handleMouseChange, eventOptions);
      window.addEventListener('touchend', handleMouseUp, { once: true });
    } else {
      window.addEventListener('mousemove', handleMouseChange, eventOptions);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    }
    e.stopPropagation();
    e.preventDefault();
  }

  // we don't return this function, it's called via mouseDown's addEventListener
  function handleMouseUp() {
    sliderState.sliderPressed = false;
    window.removeEventListener('touchmove', handleMouseChange);
    window.removeEventListener('mousemove', handleMouseChange);
  }

  function handleClick(e: ClickEvent | unknown) {
    handleMouseChange(e);
  }

  function handleMouseChange(e: ClickEvent | unknown) {
    const { value } = getCoordinates(e as ClickEvent);
    const n = roundDecimals(value);
    sliderState.thumbEl?.focus();
    if (sliderState.position !== n) sliderState.position = n;
  }

  return {
    handleKeyDown,
    handleFocus,
    handleBlur,
    handleMouseDown,
    handleClick,
    getThumbPosition,
    getThumbTransform,
    getShiftedChange,
  };
}

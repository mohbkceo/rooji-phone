import type {MotionDirection} from './navigation';

/** Tunable design parameters, not empirically fitted predictions of user performance. */
export function animateNavigation(element: HTMLElement, direction: MotionDirection, reducedMotion: boolean, rtl = false) {
 if (reducedMotion || typeof element.animate !== 'function') return;
 const sign = rtl ? -1 : 1;
 const offset = direction === 'forward' ? 12 * sign : direction === 'backward' ? -12 * sign : 0;
 return element.animate([
  {opacity: .92, transform: `translateX(${offset}px)`},
  {opacity: 1, transform: 'translateX(0)'},
 ], {duration: 200, easing: 'cubic-bezier(.2,.65,.3,1)'});
}

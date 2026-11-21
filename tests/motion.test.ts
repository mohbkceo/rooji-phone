import assert from 'node:assert/strict';
import {test} from 'node:test';
import {animateNavigation} from '../lib/motion';

test('reduced motion and engines without Web Animations do not attempt an animation', () => {
 let calls = 0;
 const element = {animate: () => {calls++;}} as unknown as HTMLElement;
 assert.equal(animateNavigation(element, 'forward', true), undefined);
 assert.equal(calls, 0);
 assert.doesNotThrow(() => animateNavigation({} as HTMLElement, 'backward', false));
});

test('directional motion reverses for parent returns and RTL; independent views do not slide', () => {
 const frames: Keyframe[][] = [];
 const result = {cancel() {}} as Animation;
 const element = {animate: (keyframes: Keyframe[]) => {frames.push(keyframes);return result;}} as unknown as HTMLElement;
 assert.equal(animateNavigation(element, 'forward', false), result);
 animateNavigation(element, 'backward', false);
 animateNavigation(element, 'forward', false, true);
 animateNavigation(element, 'neutral', false);
 assert.equal(frames[0][0].transform, 'translateX(12px)');
 assert.equal(frames[1][0].transform, 'translateX(-12px)');
 assert.equal(frames[2][0].transform, 'translateX(-12px)');
 assert.equal(frames[3][0].transform, 'translateX(0px)');
 assert.ok(frames.every(frame => frame[1].opacity === 1 && frame[1].transform === 'translateX(0)'));
});

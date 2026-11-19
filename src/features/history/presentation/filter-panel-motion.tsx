import type { PropsWithChildren } from 'react';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

const duration = 150;
const enter = FadeIn.duration(duration).reduceMotion(ReduceMotion.System);
const exit = FadeOut.duration(duration).reduceMotion(ReduceMotion.System);

export function FilterPanelMotion({ children }: PropsWithChildren) {
  return <Animated.View entering={enter} exiting={exit}>{children}</Animated.View>;
}

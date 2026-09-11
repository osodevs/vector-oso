import { CONCRETE_STYLES, type RevealStyleSetting } from './revealChoreography';

export const revealPreference = $state<{ style: RevealStyleSetting }>({
  style: 'random'
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'revealStyle', {
    get: () => revealPreference.style,
    set: (value) => {
      revealPreference.style = value;
    },
    configurable: true
  });
  Object.defineProperty(window, 'revealStyles', {
    get: () => ['random', ...CONCRETE_STYLES],
    configurable: true
  });
}

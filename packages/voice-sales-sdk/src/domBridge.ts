import type { VoiceVisualAction } from './types.ts';

/**
 * Universal DOM Bridge for dispatching synchronized actions from the Voice Sales HUD
 * to any underlying web landing page (React, Next.js, Vue, WordPress, Shopify, Webflow, HTML).
 */
export function dispatchVoiceVisualAction(
  action: VoiceVisualAction,
  customHandler?: (action: VoiceVisualAction) => void
): void {
  if (typeof window === 'undefined') return;

  // 1. Emit both standard CustomEvents so host pages can listen:
  // window.addEventListener('voice:action', (e) => console.log(e.detail))
  // window.addEventListener('tody:action', (e) => console.log(e.detail))
  window.dispatchEvent(
    new CustomEvent<VoiceVisualAction>('voice:action', {
      detail: action,
      bubbles: true,
    })
  );
  window.dispatchEvent(
    new CustomEvent<VoiceVisualAction>('tody:action', {
      detail: action,
      bubbles: true,
    })
  );

  // 2. Execute custom callback if provided
  if (customHandler) {
    customHandler(action);
  }

  // 3. Automated built-in DOM synchronization
  if (action.type === 'scrollToSection' && action.target) {
    const el =
      document.getElementById(action.target) ||
      document.querySelector(`[data-voice-target="${action.target}"]`) ||
      document.querySelector(`[data-tody-target="${action.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (
    (action.type === 'highlightArea' || action.type === 'pulseCTA') &&
    action.target
  ) {
    const el =
      document.getElementById(action.target) ||
      document.querySelector(`[data-voice-target="${action.target}"]`) ||
      document.querySelector(`[data-tody-target="${action.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('tody-highlight-ring');
      window.setTimeout(() => {
        el.classList.remove('tody-highlight-ring');
      }, 3200);
    }
  }
}

// Backward-compatibility alias
export const dispatchTodyVisualAction = dispatchVoiceVisualAction;

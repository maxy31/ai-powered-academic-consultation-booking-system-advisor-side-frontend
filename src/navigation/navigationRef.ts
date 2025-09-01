import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

type PendingNav = { name: string; params?: any };
const pending: PendingNav[] = [];

export function safeNavigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    try { (navigationRef as any).navigate(name, params); } catch (e) { console.log('[Nav] navigate error', e); }
  } else {
    pending.push({ name, params });
  }
}

export function flushPendingNavigation() {
  if (!navigationRef.isReady()) return;
  while (pending.length) {
    const p = pending.shift();
    if (p) {
      try { (navigationRef as any).navigate(p.name, p.params); } catch (e) { console.log('[Nav] pending navigate error', e); }
    }
  }
}

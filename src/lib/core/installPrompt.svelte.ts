interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;

export const installPrompt = $state<{ available: boolean }>({ available: false });

const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (navigator as { standalone?: boolean }).standalone === true);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    if (isInstalled()) return;
    deferred = event as InstallPromptEvent;
    installPrompt.available = true;
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    installPrompt.available = false;
  });
}

export async function showInstallPrompt(): Promise<void> {
  if (!deferred) return;
  const event = deferred;
  deferred = null;
  installPrompt.available = false;
  try {
    await event.prompt();
    await event.userChoice;
  } catch {
  }
}

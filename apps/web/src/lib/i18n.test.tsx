import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { I18nProvider, useTranslations, useLocale } from './i18n';

function Consumer() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span id="locale">{locale}</span>
      <span id="text">{t('nav.howItWorks')}</span>
      <button id="switch" onClick={() => setLocale('tr')}>
        Switch
      </button>
    </div>
  );
}

describe('I18nProvider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders English by default and switches locale and document.documentElement.lang', async () => {
    await act(async () => {
      root.render(
        <I18nProvider>
          <Consumer />
        </I18nProvider>,
      );
    });

    expect(container.querySelector('#locale')?.textContent).toBe('en');
    expect(container.querySelector('#text')?.textContent).toBe('How it works');
    expect(document.documentElement.lang).toBe('en');

    await act(async () => {
      (container.querySelector('#switch') as HTMLButtonElement).click();
    });

    expect(container.querySelector('#locale')?.textContent).toBe('tr');
    expect(container.querySelector('#text')?.textContent).toBe('Nasıl çalışır');
    expect(document.documentElement.lang).toBe('tr');
    expect(document.cookie).toContain('alvinmunk_locale=tr');
  });

  it('respects initialLocale prop for SSR hydration', async () => {
    await act(async () => {
      root.render(
        <I18nProvider initialLocale="tr">
          <Consumer />
        </I18nProvider>,
      );
    });

    expect(container.querySelector('#locale')?.textContent).toBe('tr');
    expect(container.querySelector('#text')?.textContent).toBe('Nasıl çalışır');
    expect(document.documentElement.lang).toBe('tr');
  });

  it('mounts without throwing even if window.localStorage getter throws', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('SecurityError', 'SecurityError');
      },
      configurable: true,
    });

    try {
      await act(async () => {
        root.render(
          <I18nProvider>
            <Consumer />
          </I18nProvider>,
        );
      });
      expect(container.querySelector('#locale')?.textContent).toBe('en');
      await act(async () => {
        (container.querySelector('#switch') as HTMLButtonElement).click();
      });
      expect(container.querySelector('#locale')?.textContent).toBe('tr');
    } finally {
      if (original) {
        Object.defineProperty(window, 'localStorage', original);
      }
    }
  });
});

(() => {
  const ATTACH_SELECTOR = 'input[type="file"][accept*="image/jpeg"][accept*="image/png"][accept*="image/webp"]';
  const READY_ATTR = 'data-conectae-camera-ready';
  const ua = navigator.userAgent || '';
  const isAppleMobile = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInstagramInApp = /Instagram/i.test(ua);
  const isMetaInApp = /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);

  const copyCurrentLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        textarea.remove();
        return ok;
      } catch {
        return false;
      }
    }
  };

  const openExternalBrowser = async () => {
    const current = window.location.href;

    if (isAppleMobile) {
      const safariScheme = current.startsWith('https://')
        ? `x-safari-https://${current.slice('https://'.length)}`
        : `x-safari-http://${current.slice('http://'.length)}`;

      window.location.href = safariScheme;

      setTimeout(async () => {
        if (document.visibilityState === 'visible') {
          const copied = await copyCurrentLink();
          window.alert(copied
            ? 'O Instagram bloqueou a abertura automática. O link foi copiado. Toque em ••• no Instagram > Abrir no navegador e, se precisar, cole o link no Safari.'
            : 'Toque em ••• no Instagram e escolha Abrir no navegador para usar câmera e upload sem erro.');
        }
      }, 900);
      return;
    }

    const withoutProtocol = current.replace(/^https?:\/\//, '');
    window.location.href = `intent://${withoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  const buildInstagramNotice = (label) => {
    if (!isInstagramInApp || label.parentElement?.querySelector('[data-conectae-instagram-notice="1"]')) return;

    const notice = document.createElement('div');
    notice.setAttribute('data-conectae-instagram-notice', '1');
    notice.style.display = 'flex';
    notice.style.alignItems = 'center';
    notice.style.gap = '8px';
    notice.style.flexWrap = 'wrap';
    notice.style.marginTop = '8px';
    notice.style.padding = '10px 12px';
    notice.style.border = '1px solid rgba(59,130,246,.35)';
    notice.style.borderRadius = '12px';
    notice.style.background = 'rgba(15,23,42,.72)';
    notice.style.fontSize = '12px';
    notice.style.lineHeight = '1.35';
    notice.style.color = 'inherit';

    const text = document.createElement('span');
    text.style.flex = '1 1 190px';
    text.textContent = 'O navegador do Instagram limita câmera e upload. Para tirar foto sem tela preta, abra esta página no Safari/Chrome.';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = isAppleMobile ? 'Abrir no Safari' : 'Abrir no navegador';
    button.style.border = '0';
    button.style.borderRadius = '9px';
    button.style.padding = '8px 10px';
    button.style.fontWeight = '700';
    button.style.cursor = 'pointer';
    button.addEventListener('click', openExternalBrowser);

    notice.append(text, button);
    label.parentElement?.appendChild(notice);
  };

  const normalizeCameraFile = async (file) => {
    if (!file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;

    try {
      const bitmap = await createImageBitmap(file);
      const max = 1800;
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) return file;
      const baseName = (file.name || 'foto').replace(/\.[^.]+$/, '') || 'foto';
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    } catch {
      return file;
    }
  };

  const forwardFileToReactInput = (targetInput, file) => {
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      targetInput.files = transfer.files;
      targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch {
      try {
        const fallbackFiles = {
          0: file,
          length: 1,
          item: (index) => (index === 0 ? file : null),
        };
        Object.defineProperty(targetInput, 'files', {
          configurable: true,
          value: fallbackFiles,
        });
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        queueMicrotask(() => {
          try { delete targetInput.files; } catch {}
        });
        return true;
      } catch {
        return false;
      }
    }
  };

  const buildCameraButton = (label, targetInput) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = label.className;
    button.title = 'Tirar foto';
    button.setAttribute('aria-label', 'Tirar foto');
    button.setAttribute('data-conectae-camera-button', '1');
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="3"/></svg>';

    button.addEventListener('click', () => {
      const cameraInput = document.createElement('input');
      cameraInput.type = 'file';
      cameraInput.accept = 'image/*';
      cameraInput.setAttribute('capture', 'environment');
      cameraInput.setAttribute('aria-hidden', 'true');
      cameraInput.tabIndex = -1;
      cameraInput.style.position = 'fixed';
      cameraInput.style.left = '-10000px';
      cameraInput.style.bottom = '-10000px';
      cameraInput.style.width = '1px';
      cameraInput.style.height = '1px';
      cameraInput.style.opacity = '0';
      document.body.appendChild(cameraInput);

      const cleanup = () => cameraInput.remove();
      cameraInput.addEventListener('change', async () => {
        const picked = cameraInput.files?.[0] || null;
        if (!picked) {
          cleanup();
          return;
        }

        const normalized = await normalizeCameraFile(picked);
        const forwarded = forwardFileToReactInput(targetInput, normalized);
        cleanup();

        if (!forwarded) {
          window.alert('Não consegui anexar a foto. Tente usar o botão de imagem ao lado para escolher a foto da Fototeca.');
        }
      }, { once: true });

      cameraInput.click();
    });

    return button;
  };

  const installCameraButtons = () => {
    document.querySelectorAll(ATTACH_SELECTOR).forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      const label = input.closest('label');
      if (!label || label.getAttribute(READY_ATTR) === '1') return;
      const row = label.parentElement;
      if (!row) return;

      label.setAttribute(READY_ATTR, '1');

      if (isMetaInApp) {
        // Meta in-app browsers (especially Instagram on iOS) may hand off
        // camera/upload to a constrained WKWebView and show a black preview.
        // Keep only the original React input and explicitly route camera use
        // to the external browser instead of creating a second camera input.
        input.accept = 'image/jpeg,image/png,image/webp';
        input.removeAttribute('capture');
        label.title = 'Anexar foto. Para tirar uma nova foto, abra no Safari/Chrome.';
        buildInstagramNotice(label);
        return;
      }

      if (isAppleMobile) {
        input.accept = 'image/*';
        input.removeAttribute('capture');
        label.title = 'Adicionar foto: escolha Tirar Foto, Fototeca ou Arquivos';
        return;
      }

      label.title = 'Anexar da Fototeca ou Arquivos';
      const button = buildCameraButton(label, input);
      label.insertAdjacentElement('afterend', button);
    });
  };

  const start = () => {
    installCameraButtons();
    const observer = new MutationObserver(installCameraButtons);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

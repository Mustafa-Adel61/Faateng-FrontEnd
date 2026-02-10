import { Injectable } from '@angular/core';

type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private duration = 1500;

  show(message: string, type: ToastType = 'info') {

    /* Overlay */
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99999',
      opacity: '0',
      transition: 'opacity .35s ease'
    });

    /* Popup */
    const popup = document.createElement('div');
    Object.assign(popup.style, {
      width: '360px',
      maxWidth: '90%',
      background: 'rgba(255,255,255,0.9)',
      borderRadius: '20px',
      padding: '22px',
      boxShadow: '0 25px 60px rgba(0,0,0,.25)',
      fontFamily: 'Inter, system-ui, sans-serif',
      transform: 'translateY(20px) scale(.95)',
      transition: 'all .35s ease'
    });

    const config = {
      success: { color: '#22c55e', icon: '✓', title: 'Success' },
      error:   { color: '#ef4444', icon: '✕', title: 'Error' },
      info:    { color: '#facc15', icon: 'ℹ', title: 'Info' }
    }[type];

    popup.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:14px">
        <div style="
          width:42px;
          height:42px;
          border-radius:50%;
          background:${config.color};
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
          font-weight:600">
          ${config.icon}
        </div>

        <div style="flex:1">
          <div style="font-weight:600;font-size:16px;color:#111">
            ${config.title}
          </div>
          <div style="margin-top:4px;font-size:14px;color:#555">
            ${message}
          </div>
        </div>

        <div class="close-btn" style="
          cursor:pointer;
          font-size:18px;
          color:#999">×</div>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      popup.style.transform = 'translateY(0) scale(1)';
    });

    const close = () => {
      overlay.style.opacity = '0';
      popup.style.transform = 'translateY(20px) scale(.95)';
      setTimeout(() => overlay.remove(), 350);
    };

    overlay.addEventListener('click', close);
    popup.querySelector('.close-btn')?.addEventListener('click', close);
    popup.addEventListener('click', e => e.stopPropagation());

    setTimeout(close, this.duration);
  }
}

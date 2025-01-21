const Bootstrapped = (function() {
  let initialized = false;
  const DEFAULT_CONFIG = {
    toasts: {
      mobileBreakpoint: 768,
      animationDuration: 200,
      defaultDuration: 3000,
      gap: 4,
      containerPosition: {
        top: '1rem',
        right: '1rem'
      },
      icons: {
        loading: 'icons/toast/loadingSpinner.svg',
        success: 'icons/toast/greenSuccess.svg',
        error: 'icons/toast/redError.svg'
      }
    }
  };

  function init(options = {}) {
    if (initialized) {
      console.warn('Bootstrapped has already been initialized');
      return;
    }

    // Deep merge options
    const mergedConfig = {
      toasts: {
        ...DEFAULT_CONFIG.toasts,
        ...options.toasts,
        icons: {
          ...DEFAULT_CONFIG.toasts.icons,
          ...options.toasts?.icons
        },
        containerPosition: {
          ...DEFAULT_CONFIG.toasts.containerPosition,
          ...options.toasts?.containerPosition
        }
      }
    };

    // Update TOAST_CONFIG
    Object.assign(TOAST_CONFIG, {
      MOBILE_BREAKPOINT: mergedConfig.toasts.mobileBreakpoint,
      ANIMATION_MS: mergedConfig.toasts.animationDuration,
      DEFAULT_DURATION: mergedConfig.toasts.defaultDuration,
      GAP: mergedConfig.toasts.gap,
      ICONS: mergedConfig.toasts.icons
    });

    // Update container styling if exists
    const container = document.getElementById('toastContainer');
    if (container) {
      Object.assign(container.style, mergedConfig.toasts.containerPosition);
    }

    initialized = true;
  }

  // Public API
  return {
    init,
    showToast,
    showLoadingToast,
    updateLoadingToast
  };
})();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Bootstrapped;
} else if (typeof define === 'function' && define.amd) {
  define([], function() { return Bootstrapped; });
} else {
  window.Bootstrapped = Bootstrapped;
}

/**
 * Bootstrapped JS
 * v0.0.1
 * 
 * 
 * Requires the following:
 *
 * __________________________________________________________________________________ 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * ___________________________________________________________________________________
 */




/*
 * Toast Notification System
 * 
 * showToast(options)
 *   Displays a toast notification
 *   - options.heading: Toast heading (default: '')
 *   - options.message: Toast message (default: '')
 *   - options.duration: Duration in ms (default: 3000, 0 for persistent)
 *   - options.iconSrc: Icon URL (default: null)
 * 
 * showLoadingToast(toastId, options) 
 *   Shows/updates a loading toast with given ID
 *   - toastId: Unique identifier (required)
 *   - options: Same as showToast + loadingHeading/loadingMessage
 * 
 * updateLoadingToast(toastId, type, options)
 *   Updates loading toast status
 *   - toastId: Toast identifier
 *   - type: 'success' | 'error'
 *   - options: Customization options
 * 
 * 
 * _____
 * Only needs the bootstrap toast container present in the DOM:
 * <div id="toastContainer" class="toast-container" style="position: fixed;width: 96%;z-index: 2060;padding-top: 0.5em;top: 0;margin-right: 2%;margin-left: 2%;"></div>
 */

const TOAST_CONFIG = {
    MOBILE_BREAKPOINT: 768,
    ANIMATION_MS: 200,
    DEFAULT_DURATION: 3000,
    GAP: 4,
    ICONS: {
      LOADING: 'icons/toast/loadingSpinner.svg',
      SUCCESS: 'icons/toast/greenSuccess.svg', 
      ERROR: 'icons/toast/redError.svg'
    }
  };
  
  // Add styles once
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
      .toast-enter { opacity: 0; transform: translateY(-100%); }
      .toast-enter-active { opacity: 1; transform: translateY(0); transition: all ${TOAST_CONFIG.ANIMATION_MS}ms ease-out; }
      .toast-exit { opacity: 1; }
      .toast-exit-active { opacity: 0; transform: translateY(-20px); transition: all ${TOAST_CONFIG.ANIMATION_MS}ms ease-out; }
      @media (max-width: ${TOAST_CONFIG.MOBILE_BREAKPOINT}px) {
        .toast-enter { transform: translateX(-50%) translateY(-100%); }
        .toast-enter-active { transform: translateX(-50%) translateY(0); }
        .toast-exit-active { transform: translateX(-50%) translateY(-20px); }
      }
    `
  }));
  
  const createToastElement = ({heading = '', message = '', iconSrc = null} = {}) => {
    const toast = document.createElement('div');
    toast.className = 'toast fade show toast-enter';
    toast.role = 'alert';
    toast.style.cssText = 'width: 350px; background: #ffffff;';
    
    toast.innerHTML = `
      <div class="toast-body d-flex justify-content-start align-items-center">
        ${iconSrc ? `<img alt="" aria-hidden="true" class="img-fluid ${iconSrc === TOAST_CONFIG.ICONS.LOADING ? 'rotatingIcon' : ''}" 
           src="${iconSrc}" style="width: 2em; height: 2em;" />` : ''}
        <div style="padding-left: ${iconSrc ? '0.7em' : '0'};">
          <p role="heading" aria-level="2" style="font-family: geistbold; font-size: 1em; color: #212121; margin-bottom: 0.25em;">${heading}</p>
          <p style="font-family: geistregular; font-size: 0.9em; color: #212121; margin-bottom: 0;">${message}</p>
        </div>
      </div>`;
      
    return toast;
  };
  
  const getOrCreateContainer = () => {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 1050;';
      document.body.appendChild(container);
    }
    return container;
  };
  
  // Update the removeToast function
  const removeToast = (toast, immediate = false) => {
    return new Promise(resolve => {
      if (immediate) {
        toast.remove();
        positionToasts();
        resolve();
        return;
      }
      
      toast.classList.replace('toast-enter-active', 'toast-exit');
      toast.classList.add('toast-exit-active');
      
      setTimeout(() => {
        toast.remove();
        positionToasts();
        resolve();
      }, TOAST_CONFIG.ANIMATION_MS);
    });
  };
  
  const positionToasts = () => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
  
    const isMobile = window.innerWidth <= TOAST_CONFIG.MOBILE_BREAKPOINT;
    let offset = 0;
    
    Array.from(container.children).reverse().forEach(toast => {
      toast.style.position = 'absolute';
      toast.style.left = isMobile ? '50%' : 'auto';
      toast.style.right = isMobile ? 'auto' : '0';
      toast.style.transform = isMobile
        ? `translateX(-50%) translateY(${offset}px)`
        : `translateY(${offset}px)`;
      offset += toast.offsetHeight + TOAST_CONFIG.GAP;
    });
  };
  
  // Update the toast removal calls
  function showToast(options = {}) {
    const settings = {
      duration: TOAST_CONFIG.DEFAULT_DURATION,
      ...options
    };
  
    const container = getOrCreateContainer();
    const toast = createToastElement(settings);
    
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-enter-active');
      positionToasts();
    });
  
    if (settings.duration > 0) {
      setTimeout(() => removeToast(toast), settings.duration);
    }
  
    if (!settings.isLoading) {
      toast.addEventListener('click', () => removeToast(toast), { once: true });
    }
  
    return toast;
  }
  
  function showLoadingToast(toastId, options = {}) {
    if (!toastId) throw new Error('Toast ID is required');
    
    // Remove existing toasts with same ID
    document.querySelectorAll(`[data-toast-id="${toastId}"]`).forEach(t => removeToast(t, true));
    
    const toast = showToast({
      heading: options.loadingHeading || 'Loading...',
      message: options.loadingMessage || 'Please wait...',
      iconSrc: TOAST_CONFIG.ICONS.LOADING,
      isLoading: true,
      duration: 0,
      ...options
    });
    
    toast.dataset.toastId = toastId;
    return toastId;
  }
  
  // Update the toast removal calls
  function updateLoadingToast(toastId, type = 'success', options = {}) {
    const toasts = document.querySelectorAll(`[data-toast-id="${toastId}"]`);
    if (!toasts.length) throw new Error(`No toast found with ID '${toastId}'`);
    
    const settings = {
      heading: type === 'success' ? 'Success!' : 'Error',
      message: type === 'success' ? 'Operation completed successfully.' : 'Something went wrong.',
      iconSrc: TOAST_CONFIG.ICONS[type.toUpperCase()],
      duration: TOAST_CONFIG.DEFAULT_DURATION,
      ...options
    };
  
    toasts.forEach(toast => {
      const img = toast.querySelector('img');
      const [heading, message] = toast.querySelectorAll('p');
      
      if (img) {
        img.src = settings.iconSrc;
        img.classList.remove('rotatingIcon');
      }
      heading.textContent = settings.heading;
      message.textContent = settings.message;
      
      setTimeout(() => removeToast(toast), settings.duration);
    });
  }
  
  // Event listener with debouncing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(positionToasts, 150);
  });

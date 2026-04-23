import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * GlassModal - Modern glassmorphism modal component
 * 
 * Props:
 * - show: boolean - Controls modal visibility
 * - onClose: function - Called when modal should close
 * - size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen' - Modal size
 * - backdrop: 'glass' | 'solid' | 'blur' - Backdrop style
 * - centered: boolean - Whether modal should be vertically centered
 * - scrollable: boolean - Whether modal content should be scrollable
 * - animation: boolean - Whether to show entrance animation
 * - closeOnBackdrop: boolean - Whether clicking backdrop closes modal
 * - closeOnEscape: boolean - Whether ESC key closes modal
 * - className: string - Additional CSS classes
 * - children: ReactNode - Modal content
 */
const GlassModal = ({
  show,
  onClose,
  size = 'md',
  backdrop = 'glass',
  centered = true,
  scrollable = true,
  animation = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  children
}) => {
  const { isDarkMode } = useTheme();
  const modalRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle ESC key
  const handleEscapeKey = (e) => {
    if (closeOnEscape && e.key === 'Escape') {
      handleClose();
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (onClose && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        onClose();
      }, animation ? 300 : 0);
    }
  };

  // Handle modal show
  const handleShow = () => {
    setIsVisible(true);
    // Focus management
    setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 100);
  };

  // Handle show/hide transitions
  useEffect(() => {
    if (show) {
      handleShow();
    } else {
      setIsVisible(false);
    }
  }, [show]);

  // Add/remove keyboard event listeners
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isVisible, closeOnEscape]);

  // Check for backdrop-filter support
  const [supportsBackdropFilter, setSupportsBackdropFilter] = useState(true);
  useEffect(() => {
    const checkSupport = () => {
      const testElement = document.createElement('div');
      testElement.style.backdropFilter = 'blur(1px)';
      setSupportsBackdropFilter(testElement.style.backdropFilter !== '');
    };
    checkSupport();
  }, []);

  if (!show && !isVisible) return null;

  const modalClasses = [
    'modal-glass-backdrop',
    `modal-${size}`,
    backdrop !== 'glass' ? `modal-${backdrop}` : '',
    centered ? 'modal-centered' : '',
    scrollable ? 'modal-scrollable' : '',
    animation ? 'modal-animated' : '',
    isVisible ? 'show' : '',
    isDarkMode ? 'dark-mode' : '',
    className
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'modal-content',
    'modal-glass-content',
    !supportsBackdropFilter ? 'no-backdrop-filter' : '',
    isAnimating ? 'modal-animating' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={modalClasses}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isVisible}
    >
      <div className="modal-dialog">
        <div 
          ref={modalRef}
          className={contentClasses}
          tabIndex="-1"
          role="document"
        >
          {children}
        </div>
      </div>

      {/* Custom styles for dynamic backdrop types */}
      <style jsx>{`
        .modal-solid .modal-glass-backdrop {
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'};
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        
        .modal-blur .modal-glass-backdrop {
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)'};
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
        }
        
        .modal-centered {
          align-items: center;
          justify-content: center;
        }
        
        .modal-scrollable .modal-glass-content {
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-animated .modal-glass-content {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .modal-animating {
          pointer-events: none;
        }
        
        .no-backdrop-filter .modal-glass-content {
          background: ${isDarkMode ? 'var(--bg-secondary)' : 'white'};
          border: 1px solid ${isDarkMode ? 'var(--border-primary)' : '#e5e7eb'};
        }
        
        .no-backdrop-filter .modal-glass-backdrop {
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)'};
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
      `}</style>
    </div>
  );
};

// Modal Header Component
export const GlassModalHeader = ({ children, className = '', ...props }) => (
  <div className={`modal-glass-header ${className}`} {...props}>
    {children}
  </div>
);

// Modal Body Component
export const GlassModalBody = ({ children, className = '', ...props }) => (
  <div className={`modal-glass-body ${className}`} {...props}>
    {children}
  </div>
);

// Modal Footer Component
export const GlassModalFooter = ({ children, className = '', ...props }) => (
  <div className={`modal-glass-footer ${className}`} {...props}>
    {children}
  </div>
);

// Loading State Component
export const GlassModalLoading = () => (
  <div className="modal-glass-content loading">
    <div className="modal-loading-spinner"></div>
  </div>
);

export default GlassModal;

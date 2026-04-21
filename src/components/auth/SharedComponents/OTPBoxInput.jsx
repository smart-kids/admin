import React, { useState, useRef, useEffect, useCallback } from 'react';
import './OTPBoxInput.css';

const OTPBoxInput = ({ length = 5, onComplete, disabled = false, autoFocus = false }) => {
    const [values, setValues] = useState(Array(length).fill(''));
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const inputRefs = useRef([]);
    const containerRef = useRef(null);

    // Initialize refs
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    // Auto-focus first input if autoFocus
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            setTimeout(() => inputRefs.current[0].focus(), 100);
        }
    }, [autoFocus]);

    // Handle paste event
    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        if (!/^\d+$/.test(pastedData)) return;
        
        const newValues = Array(length).fill('');
        const digits = pastedData.split('').slice(0, length);
        
        digits.forEach((digit, index) => {
            newValues[index] = digit;
        });
        
        setValues(newValues);
        
        // Focus the next empty box or the last filled box
        const nextEmptyIndex = newValues.findIndex(val => val === '');
        const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
        
        if (inputRefs.current[focusIndex]) {
            inputRefs.current[focusIndex].focus();
        }
        
        // Call onComplete if all boxes are filled
        if (newValues.every(val => val !== '')) {
            onComplete(newValues.join(''));
        }
    }, [length, onComplete]);

    const handleChange = useCallback((index, value) => {
        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1);
        
        const newValues = [...values];
        newValues[index] = digit;
        setValues(newValues);

        // Auto-focus next box
        if (digit && index < length - 1) {
            setTimeout(() => {
                if (inputRefs.current[index + 1]) {
                    inputRefs.current[index + 1].focus();
                }
            }, 0);
        }

        // Auto-submit when all boxes are filled
        if (newValues.every(val => val !== '')) {
            onComplete(newValues.join(''));
        }
    }, [values, length, onComplete]);

    const handleKeyDown = useCallback((index, e) => {
        switch (e.key) {
            case 'Backspace':
                e.preventDefault();
                
                if (values[index]) {
                    // Clear current box
                    const newValues = [...values];
                    newValues[index] = '';
                    setValues(newValues);
                } else if (index > 0) {
                    // Move to previous box and clear it
                    const newValues = [...values];
                    newValues[index - 1] = '';
                    setValues(newValues);
                    
                    setTimeout(() => {
                        if (inputRefs.current[index - 1]) {
                            inputRefs.current[index - 1].focus();
                        }
                    }, 0);
                }
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                if (index > 0 && inputRefs.current[index - 1]) {
                    inputRefs.current[index - 1].focus();
                }
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                if (index < length - 1 && inputRefs.current[index + 1]) {
                    inputRefs.current[index + 1].focus();
                }
                break;
                
            case 'Home':
                e.preventDefault();
                if (inputRefs.current[0]) {
                    inputRefs.current[0].focus();
                }
                break;
                
            case 'End':
                e.preventDefault();
                if (inputRefs.current[length - 1]) {
                    inputRefs.current[length - 1].focus();
                }
                break;
        }
    }, [values, length]);

    const handleFocus = useCallback((index) => {
        setFocusedIndex(index);
    }, []);

    const handleBlur = useCallback((index) => {
        setFocusedIndex(-1);
    }, []);

    const handleContainerClick = useCallback(() => {
        // Focus the first empty box, or the last box if all are filled
        const firstEmptyIndex = values.findIndex(val => val === '');
        const focusIndex = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
        
        if (inputRefs.current[focusIndex]) {
            inputRefs.current[focusIndex].focus();
        }
    }, [values, length]);

    // Handle SMS auto-detection (mobile)
    useEffect(() => {
        const handleOtpDetection = (event) => {
            // This would integrate with your SMS detection service
            // For now, we'll just log it
            console.log('OTP detected:', event.otp);
            
            if (event.otp && event.otp.length === length) {
                const digits = event.otp.split('');
                const newValues = Array(length).fill('');
                
                digits.forEach((digit, index) => {
                    if (index < length) {
                        newValues[index] = digit;
                    }
                });
                
                setValues(newValues);
                onComplete(event.otp);
            }
        };

        // Listen for custom OTP detection event
        window.addEventListener('otpDetected', handleOtpDetection);
        
        return () => {
            window.removeEventListener('otpDetected', handleOtpDetection);
        };
    }, [length, onComplete]);

    return (
        <div 
            ref={containerRef}
            className="otp-box-container"
            onClick={handleContainerClick}
        >
            {values.map((value, index) => (
                <div key={index} className="otp-input-wrapper">
                    <input
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onFocus={() => handleFocus(index)}
                        onBlur={() => handleBlur(index)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className={`otp-box ${value ? 'filled' : ''} ${focusedIndex === index ? 'focused' : ''}`}
                        disabled={disabled}
                        autoComplete="one-time-code"
                        aria-label={`OTP digit ${index + 1}`}
                        aria-describedby="otp-instructions"
                    />
                    <div className="otp-box-underline" />
                </div>
            ))}
            
            {/* Hidden instructions for screen readers */}
            <div id="otp-instructions" className="sr-only">
                Enter the {length}-digit verification code. You can use arrow keys to navigate between boxes, 
                backspace to delete and move to the previous box, and paste the full code if copied.
            </div>
        </div>
    );
};

export default OTPBoxInput;

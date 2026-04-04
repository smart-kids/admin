import React from 'react';

const EmptyState = ({ title, description, iconClass, primaryAction, primaryActionText, isSearch = false }) => {
    return (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#B5B5C3', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: '0.75rem' }}>
            <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                backgroundColor: isSearch ? '#F3F6F9' : '#F1FAFF', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                marginBottom: '1.5rem' 
            }}>
                <i className={iconClass || (isSearch ? "la la-search" : "la la-folder-open")} style={{ fontSize: '3rem', color: isSearch ? '#7E8299' : '#0095E8' }}></i>
            </div>
            <h4 style={{ color: '#181C32', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                {title}
            </h4>
            <p style={{ color: '#7E8299', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
                {description}
            </p>
            {primaryAction && primaryActionText && (
                <button 
                    onClick={primaryAction} 
                    className="btn" 
                    style={{ 
                        backgroundColor: isSearch ? '#F3F6F9' : '#0095E8', 
                        color: isSearch ? '#3F4254' : 'white', 
                        padding: '0.75rem 1.5rem', 
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.42rem'
                    }}
                >
                    {primaryActionText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

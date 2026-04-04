import React from 'react';
import { Link } from 'react-router-dom';

const OnboardingGuide = ({ schoolMeta }) => {
    // We could use schoolMeta.themeColor if available, otherwise fallback
    const brandColor = schoolMeta?.themeColor || '#EE9E3D';
    
    return (
        <div className="onboarding-guide-wrapper" style={{ padding: '2rem 1rem' }}>
            <style>{`
                .onboarding-card {
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .onboarding-header {
                    background: linear-gradient(135deg, ${brandColor} 0%, rgba(238,158,61,0.8) 100%);
                    color: white;
                    padding: 3rem 2rem;
                    text-align: center;
                    position: relative;
                }
                .onboarding-header h2 {
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    font-size: 2.2rem;
                }
                .onboarding-header p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                .onboarding-body {
                    padding: 2rem;
                }
                .onboarding-step {
                    display: flex;
                    align-items: flex-start;
                    padding: 1.5rem;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    color: inherit;
                    border: 1px solid transparent;
                    margin-bottom: 1rem;
                }
                .onboarding-step:hover {
                    background: #f8f9fa;
                    border-color: rgba(0,0,0,0.05);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    text-decoration: none;
                    color: inherit;
                }
                .step-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(238,158,61,0.1);
                    color: ${brandColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin-right: 1.5rem;
                    flex-shrink: 0;
                }
                .step-content {
                    flex-grow: 1;
                }
                .step-content h4 {
                    font-weight: 600;
                    font-size: 1.2rem;
                    margin-bottom: 0.25rem;
                    color: #2c3e50;
                }
                .step-content p {
                    color: #6c757d;
                    margin-bottom: 0;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }
                .step-action {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: ${brandColor};
                    font-weight: 600;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    padding-left: 1rem;
                }
                .onboarding-step:hover .step-action {
                    opacity: 1;
                }
                
                .progress-container {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid #edf2f9;
                    text-align: center;
                }
                .progress-bar-wrapper {
                    height: 8px;
                    background: #edf2f9;
                    border-radius: 4px;
                    margin: 1rem auto;
                    max-width: 400px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: ${brandColor};
                    width: 0%; /* We start at 0 */
                    border-radius: 4px;
                    transition: width 1s ease-in-out;
                }
            `}</style>
            
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="onboarding-card">
                            <div className="onboarding-header">
                                <h2>Welcome to ShulePlus! 🎉</h2>
                                <p>Let's get your school set up for success in 5 easy steps.</p>
                            </div>
                            <div className="onboarding-body">
                                
                                <Link to="/students" className="onboarding-step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Add Your First Student</h4>
                                        <p>The core of your school. Add a student to start tracking attendance, results, and fees.</p>
                                    </div>
                                    <div className="step-action">
                                        <i className="flaticon2-next"></i>
                                    </div>
                                </Link>

                                <Link to="/parents" className="onboarding-step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Add a Parent</h4>
                                        <p>Connect students with their guardians so they can log into the parent app and receive updates.</p>
                                    </div>
                                    <div className="step-action">
                                        <i className="flaticon2-next"></i>
                                    </div>
                                </Link>

                                <Link to="/finance/topup" className="onboarding-step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Top-Up Wallet via M-Pesa</h4>
                                        <p>Ensure your school has bulk SMS credits to communicate efficiently with your community.</p>
                                    </div>
                                    <div className="step-action">
                                        <i className="flaticon2-next"></i>
                                    </div>
                                </Link>

                                <Link to="/learning" className="onboarding-step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Create a Lesson Plan</h4>
                                        <p>Empower your teachers by structuring the term curriculum and recording academic progress.</p>
                                    </div>
                                    <div className="step-action">
                                        <i className="flaticon2-next"></i>
                                    </div>
                                </Link>

                                <Link to="/comms" className="onboarding-step">
                                    <div className="step-number">5</div>
                                    <div className="step-content">
                                        <h4>Send a Mass SMS</h4>
                                        <p>Announce to your parents that the school is now powered by ShulePlus!</p>
                                    </div>
                                    <div className="step-action">
                                        <i className="flaticon2-next"></i>
                                    </div>
                                </Link>

                                <div className="progress-container">
                                    <h5 className="text-muted" style={{ fontWeight: 500 }}>Setup Progress: 0%</h5>
                                    <div className="progress-bar-wrapper">
                                        <div className="progress-fill"></div>
                                    </div>
                                    <p className="text-muted small mb-0">Complete the checklist to unlock your full dashboard view.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingGuide;

import React from "react";
import "./Hero.css";
import HeroImage from "../../assets/images/Hero-img.jpg";

const HeroSection = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-title-container">
            <span className="hero-badge">Professional Certification</span>
            <h1>Your All-in-One Exam Platform</h1>
            <p className="hero-subtitle">
              Take practice exams, get instant scores, and track your progress
              with our intuitive dashboard
            </p>
          </div>

          <div className="feature-highlights">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Practice Exams</h3>
              <p>
                Access hundreds of practice questions with detailed explanations
              </p>
              <span className="feature-badge">Most Popular</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Instant Results</h3>
              <p>Get immediate feedback and performance analysis</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your improvement with visual analytics</p>
            </div>
          </div>

          <div className="hero-cta">
            <button className="hero-button primary">Get Started Free</button>
            <button className="hero-button secondary">View Demo</button>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-container">
            <img src={HeroImage} alt="Exam Dashboard" />
            <div className="stats-card">
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Pass Rate</span>
              </div>
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Students</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section - Stacked below hero section */}
      <div className="testimonials-section">
        <div className="testimonials-container">
          <h2 className="testimonials-heading">
            Success Stories from Our Students <span className="emoji">🎉</span>
          </h2>
          <p className="testimonials-subheading">
            Join thousands of students who achieved their certification goals
          </p>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-score">
                <span className="score-value">92%</span>
                <span className="exam-name">CCNA Exam</span>
              </div>
              <p className="testimonial-quote">
                "I struggled with network protocols for months. This platform's
                practice tests identified my weak areas and helped me focus my
                study time efficiently. Passed on my first attempt!"
              </p>
              <div className="testimonial-footer">
                <div className="testimonial-author-avatar">JD</div>
                <div className="testimonial-author-info">
                  <p className="testimonial-author-name">James Davis</p>
                  <p className="testimonial-author-title">Network Engineer</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card featured">
              <div className="testimonial-badge">Top Student</div>
              <div className="testimonial-score">
                <span className="score-value">98%</span>
                <span className="exam-name">AWS Solutions Architect</span>
              </div>
              <p className="testimonial-quote">
                "The analytics dashboard showed exactly where I needed to
                improve. After 4 weeks of targeted practice, I not only passed
                but scored in the top 5% nationally. Worth every penny!"
              </p>
              <div className="testimonial-footer">
                <div className="testimonial-author-avatar">AR</div>
                <div className="testimonial-author-info">
                  <p className="testimonial-author-name">Aisha Rahman</p>
                  <p className="testimonial-author-title">
                    Cloud Solutions Architect
                  </p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-score">
                <span className="score-value">85%</span>
                <span className="exam-name">CompTIA Security+</span>
              </div>
              <p className="testimonial-quote">
                "Failed twice before finding this platform. The practice
                questions were remarkably similar to the actual exam, and the
                performance tracking helped me identify and eliminate my
                knowledge gaps."
              </p>
              <div className="testimonial-footer">
                <div className="testimonial-author-avatar">MK</div>
                <div className="testimonial-author-info">
                  <p className="testimonial-author-name">Mike Klein</p>
                  <p className="testimonial-author-title">
                    IT Security Specialist
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="testimonials-stats">
            <div className="stat-item">
              <span className="stat-number">15,000+</span>
              <span className="stat-label">Certified Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">94%</span>
              <span className="stat-label">Pass Rate</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">250+</span>
              <span className="stat-label">Exam Types</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">30%</span>
              <span className="stat-label">Higher Scores</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;

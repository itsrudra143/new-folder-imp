import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTestResult } from "../../hooks/useTests";
import "./TestResult.css";

const TestResult = () => {
  const { id } = useParams();
  const { data: result, isLoading, error } = useTestResult(id);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "N/A";
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + "m" : ""}`;
  };

  // Calculate score percentage
  const calculatePercentage = (score, total) => {
    if (!score && score !== 0) return 0;
    if (!total) return 0;
    return Math.round((score / total) * 100);
  };

  // Determine if passed or failed
  const isPassed = (score, total) => {
    const percentage = calculatePercentage(score, total);
    return percentage >= 70; // Assuming 70% is passing
  };

  if (isLoading) {
    return <div className="loading-container">Loading result...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Result</h2>
        <p>{error.message}</p>
        <Link to="/dashboard" className="back-link">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="not-found-container">
        <h2>Result Not Found</h2>
        <p>The test result you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/dashboard" className="back-link">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const scorePercentage = calculatePercentage(result.score, result.totalQuestions);
  const passed = isPassed(result.score, result.totalQuestions);

  return (
    <div className="test-result-container">
      <div className="result-header">
        <h1>Test Result</h1>
        <Link to="/dashboard" className="back-to-dashboard">
          Back to Dashboard
        </Link>
      </div>

      <div className="result-summary">
        <div className="test-info">
          <h2>{result.test?.title || "Test"}</h2>
          <p className="test-description">{result.test?.description || "No description available"}</p>
        </div>

        <div className="score-card">
          <div className={`score-circle ${passed ? "pass" : "fail"}`}>
            <div className="score-percentage">{scorePercentage}%</div>
            <div className="score-label">{passed ? "PASSED" : "FAILED"}</div>
          </div>
          <div className="score-details">
            <div className="score-item">
              <span className="score-item-label">Score:</span>
              <span className="score-item-value">
                {result.score} / {result.totalQuestions}
              </span>
            </div>
            <div className="score-item">
              <span className="score-item-label">Date Taken:</span>
              <span className="score-item-value">
                {formatDate(result.completedAt || result.createdAt)}
              </span>
            </div>
            <div className="score-item">
              <span className="score-item-label">Duration:</span>
              <span className="score-item-value">
                {formatDuration(result.test?.duration)}
              </span>
            </div>
            <div className="score-item">
              <span className="score-item-label">Status:</span>
              <span className={`status-badge ${result.status.toLowerCase()}`}>
                {result.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="result-details">
        <h3>Question Analysis</h3>
        
        {result.answers && result.answers.length > 0 ? (
          <div className="questions-list">
            {result.answers.map((answer, index) => {
              const question = result.test?.questions?.find(q => q.id === answer.questionId);
              if (!question) return null;
              
              const isCorrect = answer.isCorrect;
              
              return (
                <div key={answer.id} className={`question-item ${isCorrect ? "correct" : "incorrect"}`}>
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-content">
                    <div className="question-text">{question.text}</div>
                    
                    {question.type === "MCQ" && (
                      <div className="answer-options">
                        {question.options.map(option => {
                          const isSelected = option.id === answer.optionId;
                          const correctOption = question.options.find(opt => opt.isCorrect);
                          
                          return (
                            <div 
                              key={option.id} 
                              className={`option ${isSelected ? "selected" : ""} ${
                                isSelected && !isCorrect ? "wrong" : ""
                              } ${option.isCorrect ? "correct-option" : ""}`}
                            >
                              <span className="option-marker"></span>
                              <span className="option-text">{option.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {question.type === "CHECKBOX" && (
                      <div className="answer-options">
                        {question.options.map(option => {
                          const isSelected = answer.selectedOptions?.includes(option.id);
                          
                          return (
                            <div 
                              key={option.id} 
                              className={`option ${isSelected ? "selected" : ""} ${
                                option.isCorrect ? "correct-option" : ""
                              }`}
                            >
                              <span className="option-marker"></span>
                              <span className="option-text">{option.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {question.type === "TEXT" && (
                      <div className="text-answer">
                        <div className="your-answer">
                          <h4>Your Answer:</h4>
                          <div className="answer-text">{answer.textAnswer || "No answer provided"}</div>
                        </div>
                        {question.correctAnswer && (
                          <div className="correct-answer">
                            <h4>Correct Answer:</h4>
                            <div className="answer-text">{question.correctAnswer}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {question.type === "CODING" && (
                      <div className="code-answer">
                        <div className="your-answer">
                          <h4>Your Code:</h4>
                          <pre className="code-block">{answer.codeAnswer || "No code provided"}</pre>
                        </div>
                        {question.sampleSolution && (
                          <div className="sample-solution">
                            <h4>Sample Solution:</h4>
                            <pre className="code-block">{question.sampleSolution}</pre>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="question-explanation">
                        <h4>Explanation:</h4>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </div>
                  <div className="question-status">
                    {isCorrect ? (
                      <span className="correct-icon">✓</span>
                    ) : (
                      <span className="incorrect-icon">✗</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-answers">
            <p>No answer data available for this test.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResult; 
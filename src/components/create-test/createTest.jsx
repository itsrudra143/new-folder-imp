import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTest } from "../../hooks/useTests";
import "./createTest.css";

function TestCreator() {
  const navigate = useNavigate();
  const createTestMutation = useCreateTest();

  // --- Test Details State ---
  const [testTitle, setTestTitle] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [isUnlimitedAttempts, setIsUnlimitedAttempts] = useState(false);
  const [expiryDuration, setExpiryDuration] = useState("");
  const [expiryUnit, setExpiryUnit] = useState("days");
  const [isInfiniteExpiry, setIsInfiniteExpiry] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [useStartDateTime, setUseStartDateTime] = useState(false);
  const [requiresRecording, setRequiresRecording] = useState(true);

  // --- Questions State ---
  const [questions, setQuestions] = useState([
    {
      // Common fields
      id: 1,
      text: "",
      type: "MCQ",
      required: false,
      // MCQ/Checkbox specific
      options: [
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
      ],
      // Coding specific (initialized but might not be used depending on type)
      programmingLanguage: "javascript",
      starterCode: "// Write your code here",
      testCases: [
        { id: 1, input: "", expectedOutput: "", visible: true },
        { id: 2, input: "", expectedOutput: "", visible: true },
        { id: 3, input: "", expectedOutput: "", visible: false },
      ],
    },
  ]);

  // --- UI State ---
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewAsStudent, setPreviewAsStudent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // === Helper Functions ===

  const getNextId = (items) => {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map((item) => item.id)) + 1;
  };

  // === State Update Handlers ===

  const handleQuestionChange = (id, field, value) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (questionId, optionId, field, value) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId) return q;

        const updatedOptions = q.options.map((opt) => {
          if (opt.id !== optionId) {
            // For MCQ, uncheck other options if this one is marked correct
            return field === "isCorrect" && value === true && q.type === "MCQ"
              ? { ...opt, isCorrect: false }
              : opt;
          }
          // Update the changed option
          return { ...opt, [field]: value };
        });

        return { ...q, options: updatedOptions };
      })
    );
  };

  const handleTestCaseChange = (questionId, testCaseId, field, value) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId || q.type !== "CODING") return q;

        const updatedTestCases = q.testCases.map((tc) =>
          tc.id === testCaseId ? { ...tc, [field]: value } : tc
        );

        return { ...q, testCases: updatedTestCases };
      })
    );
  };

  const toggleTestCaseVisibility = (questionId, testCaseId) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId || q.type !== "CODING") return q;

        const updatedTestCases = q.testCases.map((tc) =>
          tc.id === testCaseId ? { ...tc, visible: !tc.visible } : tc
        );

        return { ...q, testCases: updatedTestCases };
      })
    );
  };

  // === Question/Option Management ===

  const addQuestion = (type = "MCQ") => {
    const newId = getNextId(questions);

    const baseQuestion = {
      id: newId,
      text: "",
      type: type,
      required: false,
    };

    let newQuestionSpecifics = {};

    if (type === "MCQ" || type === "CHECKBOX") {
      newQuestionSpecifics = {
        options: [
          { id: 1, text: "", isCorrect: false },
          { id: 2, text: "", isCorrect: false },
        ],
      };
    } else if (type === "CODING") {
      newQuestionSpecifics = {
        programmingLanguage: "javascript",
        starterCode: "// Write your code here",
        testCases: [
          { id: 1, input: "", expectedOutput: "", visible: true },
          { id: 2, input: "", expectedOutput: "", visible: true },
          { id: 3, input: "", expectedOutput: "", visible: false }, // Start with some hidden
        ],
      };
    }

    setQuestions((prev) => [
      ...prev,
      { ...baseQuestion, ...newQuestionSpecifics },
    ]);
  };

  const removeQuestion = (id) => {
    if (questions.length <= 1) return; // Keep at least one question
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addOption = (questionId) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId || (q.type !== "MCQ" && q.type !== "CHECKBOX"))
          return q;

        const newOptionId = getNextId(q.options);
        return {
          ...q,
          options: [
            ...q.options,
            { id: newOptionId, text: "", isCorrect: false },
          ],
        };
      })
    );
  };

  const removeOption = (questionId, optionId) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId || q.options.length <= 2) return q;

        const isRemovingCorrect = q.options.find(
          (o) => o.id === optionId
        )?.isCorrect;
        const filteredOptions = q.options.filter((o) => o.id !== optionId);

        // If removing the only correct MCQ option, make the new first one correct
        if (
          q.type === "MCQ" &&
          isRemovingCorrect &&
          filteredOptions.length > 0 &&
          !filteredOptions.some((o) => o.isCorrect)
        ) {
          filteredOptions[0].isCorrect = true;
        }

        return { ...q, options: filteredOptions };
      })
    );
  };

  const addTestCase = (questionId) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId || q.type !== "CODING") return q;
        const newTestCaseId = getNextId(q.testCases);
        return {
          ...q,
          testCases: [
            ...q.testCases,
            {
              id: newTestCaseId,
              input: "",
              expectedOutput: "",
              visible: false,
            }, // Default new to hidden
          ],
        };
      })
    );
  };

  const removeTestCase = (questionId, testCaseId) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId || q.testCases.length <= 1) return q; // Keep at least one test case
        return {
          ...q,
          testCases: q.testCases.filter((tc) => tc.id !== testCaseId),
        };
      })
    );
  };

  const changeQuestionType = (questionId, newType) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id !== questionId) return q;

        let updatedQuestion = { ...q, type: newType };

        // Initialize or clear properties based on the new type
        if (newType === "MCQ" || newType === "CHECKBOX") {
          updatedQuestion.options =
            q.options?.length >= 2
              ? q.options
              : [
                  { id: 1, text: "", isCorrect: false },
                  { id: 2, text: "", isCorrect: false },
                ];
          if (
            newType === "MCQ" &&
            !updatedQuestion.options.some((o) => o.isCorrect)
          ) {
            updatedQuestion.options[0].isCorrect = true; // Ensure one correct option for MCQ
          }
          // Clear coding properties if they exist
          delete updatedQuestion.programmingLanguage;
          delete updatedQuestion.starterCode;
          delete updatedQuestion.testCases;
        } else if (newType === "CODING") {
          updatedQuestion.programmingLanguage =
            q.programmingLanguage || "javascript";
          updatedQuestion.starterCode =
            q.starterCode || "// Write your code here";
          updatedQuestion.testCases =
            q.testCases?.length >= 1
              ? q.testCases
              : [{ id: 1, input: "", expectedOutput: "", visible: true }];
          // Clear options if they exist
          delete updatedQuestion.options;
        } else {
          // Handle TEXT or other types if needed
          delete updatedQuestion.options;
          delete updatedQuestion.programmingLanguage;
          delete updatedQuestion.starterCode;
          delete updatedQuestion.testCases;
        }

        return updatedQuestion;
      })
    );
  };

  const duplicateQuestion = (id) => {
    const questionToDuplicate = questions.find((q) => q.id === id);
    if (!questionToDuplicate) return;

    const newId = getNextId(questions);
    // Deep clone the question object to avoid shared references
    const duplicatedQuestion = JSON.parse(JSON.stringify(questionToDuplicate));
    duplicatedQuestion.id = newId;

    // If it has options or test cases, give them new unique IDs as well
    if (duplicatedQuestion.options) {
      duplicatedQuestion.options = duplicatedQuestion.options.map(
        (opt, index) => ({ ...opt, id: index + 1 })
      );
    }
    if (duplicatedQuestion.testCases) {
      duplicatedQuestion.testCases = duplicatedQuestion.testCases.map(
        (tc, index) => ({ ...tc, id: index + 1 })
      );
    }

    const index = questions.findIndex((q) => q.id === id);
    const updatedQuestions = [
      ...questions.slice(0, index + 1),
      duplicatedQuestion,
      ...questions.slice(index + 1),
    ];
    setQuestions(updatedQuestions);
  };

  // === Validation ===

  const validateTest = () => {
    setError(""); // Clear previous errors

    if (!testTitle.trim()) {
      setError("Test title is required.");
      return false;
    }

    for (const q of questions) {
      if (!q.text.trim()) {
        setError(`Question ${questions.indexOf(q) + 1} text cannot be empty.`);
        return false;
      }

      if (q.type === "MCQ" || q.type === "CHECKBOX") {
        if (!q.options || q.options.length < 2) {
          setError(
            `Question ${questions.indexOf(q) + 1} must have at least 2 options.`
          );
          return false;
        }
        if (q.options.some((o) => !o.text.trim())) {
          setError(
            `Question ${questions.indexOf(q) + 1} has empty option text.`
          );
          return false;
        }
        if (q.type === "MCQ" && !q.options.some((o) => o.isCorrect)) {
          setError(
            `Question ${
              questions.indexOf(q) + 1
            } (MCQ) must have one correct option selected.`
          );
          return false;
        }
      }

      if (q.type === "CODING") {
        if (!q.programmingLanguage) {
          setError(
            `Question ${
              questions.indexOf(q) + 1
            } (Coding) must have a language selected.`
          );
          return false;
        }
        if (!q.starterCode?.trim()) {
          setError(
            `Question ${
              questions.indexOf(q) + 1
            } (Coding) must have starter code.`
          );
          return false;
        }
        if (!q.testCases || q.testCases.length === 0) {
          setError(
            `Question ${
              questions.indexOf(q) + 1
            } (Coding) must have at least one test case.`
          );
          return false;
        }
        if (
          q.testCases.some(
            (tc) => !tc.input?.trim() || !tc.expectedOutput?.trim()
          )
        ) {
          setError(
            `Question ${
              questions.indexOf(q) + 1
            } (Coding) has test cases with empty input or output.`
          );
          return false;
        }
      }
    }

    if (useStartDateTime && !startDate) {
      setError("Start date is required when scheduling is enabled.");
      return false;
    }
    if (useStartDateTime && startDate && startTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      if (startDateTime <= new Date()) {
        setError("Scheduled start date and time must be in the future.");
        return false;
      }
    }

    if (
      !isInfiniteExpiry &&
      (!expiryDuration || parseInt(expiryDuration, 10) <= 0)
    ) {
      setError(
        "Expiry duration must be a positive number when 'Never expires' is unchecked."
      );
      return false;
    }

    return true;
  };

  // === API Submission ===

  const handleSaveTest = async () => {
    if (!validateTest()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    let startDateTime = null;
    if (useStartDateTime && startDate) {
      const timeStr = startTime || "00:00";
      startDateTime = new Date(`${startDate}T${timeStr}`);
    }

    const testData = {
      title: testTitle,
      description: testDescription,
      duration: parseInt(duration, 10) || 60,
      maxAttempts: isUnlimitedAttempts ? -1 : parseInt(maxAttempts, 10) || 1,
      expiryDuration: isInfiniteExpiry ? null : parseInt(expiryDuration, 10),
      expiryUnit: expiryUnit,
      startTime: startDateTime?.toISOString() || null,
      requiresRecording: requiresRecording,
      questions: questions.map((q, index) => {
        const commonData = {
          text: q.text,
          type: q.type,
          required: q.required,
          order: index + 1,
        };

        if (q.type === "MCQ" || q.type === "CHECKBOX") {
          return {
            ...commonData,
            options: q.options.map(({ text, isCorrect }) => ({
              text,
              isCorrect,
            })),
          };
        } else if (q.type === "CODING") {
          return {
            ...commonData,
            programmingLanguage: q.programmingLanguage,
            starterCode: q.starterCode,
            testCases: q.testCases.map(
              ({ input, expectedOutput, visible }) => ({
                input,
                expectedOutput,
                visible,
              })
            ),
          };
        } else {
          // Handle TEXT or other types if needed
          return commonData;
        }
      }),
    };

    try {
      await createTestMutation.mutateAsync(testData);
      alert("Test created successfully!");
      navigate("/dashboard"); // Navigate to admin dashboard or test list
    } catch (err) {
      console.error("Error creating test:", err);
      setError(
        err.response?.data?.message || "Failed to save test. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Preview Logic ===

  const togglePreviewMode = (asStudent = false) => {
    if (validateTest()) {
      setIsPreviewMode(true);
      setPreviewAsStudent(asStudent);
    } else {
      // Error state is already set by validateTest()
      window.scrollTo(0, 0); // Scroll to top to show error
    }
  };

  // Render function for preview (details omitted for brevity, assume they handle new fields)
  const renderQuestionPreviewAdmin = (question, index) => {
    // ... implementation needs to show language, starter code, all test cases ...
    return (
      <div className="question-preview admin-preview">
        <h4>
          Question {index + 1} {question.required && "*"} ({question.type})
        </h4>
        <p>{question.text || "(No text)"}</p>
        {/* Render options or coding details based on type */}
        {(question.type === "MCQ" || question.type === "CHECKBOX") && (
          <div className="options-preview">
            {question.options?.map((opt) => (
              <div
                key={opt.id}
                className={`option-item ${opt.isCorrect ? "correct" : ""}`}>
                <input
                  type={question.type === "MCQ" ? "radio" : "checkbox"}
                  checked={opt.isCorrect}
                  disabled
                />
                <span>
                  {opt.text || "(No option text)"} {opt.isCorrect ? "✓" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
        {question.type === "CODING" && (
          <div className="coding-preview">
            <p>
              <strong>Language:</strong> {question.programmingLanguage}
            </p>
            <p>
              <strong>Starter Code:</strong>
            </p>
            <pre className="code-block">{question.starterCode || "(None)"}</pre>
            <p>
              <strong>Test Cases:</strong>
            </p>
            <table className="test-cases-table-preview">
              <thead>
                <tr>
                  <th>Input</th>
                  <th>Expected Output</th>
                  <th>Visible</th>
                </tr>
              </thead>
              <tbody>
                {question.testCases?.map((tc, i) => (
                  <tr key={i}>
                    <td>
                      <pre>{tc.input || "(None)"}</pre>
                    </td>
                    <td>
                      <pre>{tc.expectedOutput || "(None)"}</pre>
                    </td>
                    <td>{tc.visible ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderQuestionPreviewStudent = (question, index) => {
    // ... (MCQ/Checkbox rendering remains the same) ...

    if (question.type === "CODING") {
      // Filter only visible test cases for students
      const visibleTestCases =
        question.testCases?.filter((tc) => tc.visible) || [];

      return (
        <div className="question-preview student-preview">
          <h4>
            Question {index + 1} {question.required && "*"} ({question.type})
          </h4>
          <p className="question-text">
            {question.text || "(No question text)"}
          </p>

          <div className="coding-preview">
            <p>
              <strong>Language:</strong> {question.programmingLanguage}
            </p>
            <p>
              <strong>Starter Code:</strong>
            </p>
            <pre className="code-block">{question.starterCode || "(None)"}</pre>

            {/* Use table for visible test cases */}
            <p>
              <strong>Sample Test Cases:</strong>
            </p>
            <table className="test-cases-table test-cases-table-preview">
              {" "}
              {/* Added base table class */}
              <thead>
                <tr>
                  <th>Input</th>
                  <th>Expected Output</th>
                </tr>
              </thead>
              <tbody>
                {visibleTestCases.map(
                  (
                    testCase,
                    i // Use map index or testCase.id if stable
                  ) => (
                    <tr key={testCase.id || i}>
                      {" "}
                      {/* Use stable key */}
                      <td>
                        <pre>{testCase.input || "(None)"}</pre>
                      </td>
                      <td>
                        <pre>{testCase.expectedOutput || "(None)"}</pre>
                      </td>
                    </tr>
                  )
                )}
                {visibleTestCases.length === 0 && (
                  <tr>
                    <td colSpan="2">(No visible sample test cases)</td>
                  </tr>
                )}
              </tbody>
            </table>
            <p>
              <em>
                Note: Additional hidden test cases may be used for evaluation.
              </em>
            </p>
          </div>
        </div>
      );
    }
    // Fallback for other types or if type is not CODING
    return (
      <div className="question-preview student-preview">
        <h4>
          {" "}
          Question {index + 1} {question.required && "*"} ({question.type}){" "}
        </h4>
        <p>{question.text || "(No text)"}</p>
        {/* Render basic text input or placeholder if needed */}
      </div>
    );
  };

  // === Question Editor Rendering ===

  const renderQuestionEditor = (question, index) => {
    // Use class names from createTest.css
    return (
      <div
        key={question.id}
        className="question-editor">
        <div className="question-header">
          <h3>Question {index + 1}</h3>
          <div className="question-actions">
            <select
              value={question.type}
              onChange={(e) => changeQuestionType(question.id, e.target.value)}>
              <option value="MCQ">Multiple Choice</option>
              <option value="CHECKBOX">Checkbox</option>
              <option value="CODING">Coding</option>
            </select>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) =>
                  handleQuestionChange(
                    question.id,
                    "required",
                    e.target.checked
                  )
                }
              />
              Required
            </label>
            <button
              className="duplicate-button"
              title="Duplicate Question"
              onClick={() => duplicateQuestion(question.id)}>
              Duplicate
            </button>
            <button
              className="remove-button"
              title="Remove Question"
              onClick={() => removeQuestion(question.id)}
              disabled={questions.length === 1}>
              Remove
            </button>
          </div>
        </div>

        <div className="question-content">
          <div className="form-group">
            <label htmlFor={`question-text-${question.id}`}>
              Question Text *
            </label>
            <textarea
              id={`question-text-${question.id}`}
              value={question.text}
              onChange={(e) =>
                handleQuestionChange(question.id, "text", e.target.value)
              }
              placeholder="Enter the question prompt here..."
              rows={3}
            />
          </div>

          {/* --- MCQ/Checkbox Editor --- */}
          {(question.type === "MCQ" || question.type === "CHECKBOX") && (
            <div className="options-editor">
              <h4>Options *</h4>
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="option-editor">
                  <input
                    type={question.type === "MCQ" ? "radio" : "checkbox"}
                    name={`correct-option-${question.id}`}
                    checked={option.isCorrect}
                    onChange={(e) =>
                      handleOptionChange(
                        question.id,
                        option.id,
                        "isCorrect",
                        e.target.checked
                      )
                    }
                    title={
                      question.type === "MCQ"
                        ? "Select correct answer"
                        : "Mark all correct answers"
                    }
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      handleOptionChange(
                        question.id,
                        option.id,
                        "text",
                        e.target.value
                      )
                    }
                  />
                  <button
                    className="remove-option-button"
                    title="Remove Option"
                    onClick={() => removeOption(question.id, option.id)}
                    disabled={question.options.length <= 2}>
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="add-option-button"
                onClick={() => addOption(question.id)}>
                Add Option
              </button>
            </div>
          )}

          {/* --- Coding Editor --- */}
          {question.type === "CODING" && (
            <div className="coding-editor">
              <div className="form-group">
                <label htmlFor={`language-${question.id}`}>
                  Programming Language *
                </label>
                <select
                  id={`language-${question.id}`}
                  value={question.programmingLanguage}
                  onChange={(e) =>
                    handleQuestionChange(
                      question.id,
                      "programmingLanguage",
                      e.target.value
                    )
                  }>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor={`starter-code-${question.id}`}>
                  Starter Code *
                </label>
                <textarea
                  id={`starter-code-${question.id}`}
                  value={question.starterCode}
                  onChange={(e) =>
                    handleQuestionChange(
                      question.id,
                      "starterCode",
                      e.target.value
                    )
                  }
                  className="code-editor"
                  placeholder="Provide starter code (e.g., function signature)"
                  rows={5}
                />
              </div>

              {/* --- Test Cases Editor --- */}
              <div className="form-group">
                <label>Test Cases *</label>
                <div className="test-cases-container">
                  <table className="test-cases-table">
                    <thead>
                      <tr>
                        <th>Input</th>
                        <th>Expected Output</th>
                        <th>Visible to Student</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {question.testCases.map((testCase) => (
                        <tr key={testCase.id}>
                          <td>
                            <textarea
                              value={testCase.input}
                              onChange={(e) =>
                                handleTestCaseChange(
                                  question.id,
                                  testCase.id,
                                  "input",
                                  e.target.value
                                )
                              }
                              placeholder="Input (e.g., 5, [1, 2, 3])"
                              rows={2}
                              className="test-case-input"
                            />
                          </td>
                          <td>
                            <textarea
                              value={testCase.expectedOutput}
                              onChange={(e) =>
                                handleTestCaseChange(
                                  question.id,
                                  testCase.id,
                                  "expectedOutput",
                                  e.target.value
                                )
                              }
                              placeholder="Expected Output (e.g., 10, true)"
                              rows={2}
                              className="test-case-output"
                            />
                          </td>
                          <td className="visibility-toggle">
                            <input
                              type="checkbox"
                              id={`visibility-${question.id}-${testCase.id}`}
                              checked={testCase.visible}
                              onChange={() =>
                                toggleTestCaseVisibility(
                                  question.id,
                                  testCase.id
                                )
                              }
                            />
                            <label
                              htmlFor={`visibility-${question.id}-${testCase.id}`}>
                              {testCase.visible ? "Visible" : "Hidden"}
                            </label>
                          </td>
                          <td>
                            <button
                              className="remove-button"
                              title="Remove Test Case"
                              onClick={() =>
                                removeTestCase(question.id, testCase.id)
                              }
                              disabled={question.testCases.length <= 1}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    className="add-question-button"
                    onClick={() => addTestCase(question.id)}>
                    Add Test Case
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // === Main Render ===

  return (
    <div className="test-creator-container">
      <div className="test-creator-header">
        <h1>
          {isPreviewMode
            ? `Test Preview ${
                previewAsStudent ? "(Student View)" : "(Admin View)"
              }`
            : "Create Test"}
        </h1>
        <div className="test-creator-actions">
          {isPreviewMode ? (
            <button
              className="edit-button"
              onClick={() => setIsPreviewMode(false)}>
              Back to Editor
            </button>
          ) : (
            <>
              <button
                className="preview-button"
                onClick={() => togglePreviewMode(false)}>
                Preview as Admin
              </button>
              <button
                className="preview-button student"
                onClick={() => togglePreviewMode(true)}>
                Preview as Student
              </button>
            </>
          )}
          <button
            className="save-button"
            onClick={handleSaveTest}
            disabled={isSubmitting || isPreviewMode}>
            {isSubmitting ? "Saving..." : "Save Test"}
          </button>
        </div>
      </div>

      {error && <div className="error-message test-error">{error}</div>}

      {isPreviewMode ? (
        <div className="test-preview">
          <div className="test-preview-header">
            <h2>{testTitle || "(Untitled Test)"}</h2>
            <p className="test-description">
              {testDescription || "(No description)"}
            </p>
            <p>Duration: {duration} minutes</p>
            <p>
              Attempts allowed:{" "}
              {isUnlimitedAttempts ? "Unlimited" : maxAttempts}
            </p>
            <p>
              Expires:{" "}
              {isInfiniteExpiry
                ? "Never"
                : `After ${expiryDuration || "?"} ${expiryUnit}`}
            </p>
            {useStartDateTime && startDate && (
              <p>
                Available from:{" "}
                {new Date(
                  `${startDate}T${startTime || "00:00"}`
                ).toLocaleString()}
              </p>
            )}
          </div>
          <div className="preview-questions-list">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="preview-question-wrapper">
                {previewAsStudent
                  ? renderQuestionPreviewStudent(q, index)
                  : renderQuestionPreviewAdmin(q, index)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="test-editor">
          <div className="test-details-editor">
            <h2>Test Details</h2>
            <div className="form-group">
              <label htmlFor="test-title">Test Title *</label>
              <input
                type="text"
                id="test-title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g., Midterm Exam - Data Structures"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="test-description">Test Description</label>
              <textarea
                id="test-description"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                placeholder="Instructions or details about the test (optional)"
                rows={3}
              />
            </div>

            <div className="test-settings-container">
              <div className="test-settings-row">
                <div className="settings-field">
                  <label htmlFor="test-duration">Duration (minutes) *</label>
                  <input
                    type="number"
                    id="test-duration"
                    value={duration}
                    onChange={(e) =>
                      setDuration(
                        Math.max(1, parseInt(e.target.value, 10)) || 1
                      )
                    }
                    min="1"
                    required
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="max-attempts">Maximum Attempts</label>
                  <div className="input-checkbox-inline">
                    <input
                      type="number"
                      id="max-attempts"
                      value={maxAttempts}
                      onChange={(e) =>
                        setMaxAttempts(
                          Math.max(1, parseInt(e.target.value, 10)) || 1
                        )
                      }
                      min="1"
                      disabled={isUnlimitedAttempts}
                    />
                    <div className="checkbox-inline">
                      <input
                        type="checkbox"
                        id="unlimited-attempts"
                        checked={isUnlimitedAttempts}
                        onChange={(e) => {
                          setIsUnlimitedAttempts(e.target.checked);
                          if (e.target.checked) setMaxAttempts(1);
                        }}
                      />
                      <label htmlFor="unlimited-attempts">Unlimited</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="test-settings-row">
                <div className="settings-field">
                  <div className="checkbox-label-container">
                    <input
                      type="checkbox"
                      id="use-start-datetime"
                      checked={useStartDateTime}
                      onChange={(e) => setUseStartDateTime(e.target.checked)}
                    />
                    <label htmlFor="use-start-datetime">
                      Set start date/time
                    </label>
                  </div>
                  {useStartDateTime && (
                    <div className="datetime-inputs">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="settings-field">
                  <label>Expiry</label>
                  <div className="input-checkbox-inline">
                    <div className="expiry-inputs">
                      <input
                        type="number"
                        value={expiryDuration}
                        onChange={(e) =>
                          setExpiryDuration(
                            Math.max(1, parseInt(e.target.value, 10)) || ""
                          )
                        }
                        min="1"
                        disabled={isInfiniteExpiry}
                        placeholder="Duration"
                      />
                      <select
                        value={expiryUnit}
                        onChange={(e) => setExpiryUnit(e.target.value)}
                        disabled={isInfiniteExpiry}>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>
                    <div className="checkbox-inline">
                      <input
                        type="checkbox"
                        id="never-expires"
                        checked={isInfiniteExpiry}
                        onChange={(e) => {
                          setIsInfiniteExpiry(e.target.checked);
                          if (e.target.checked) setExpiryDuration("");
                        }}
                      />
                      <label htmlFor="never-expires">Never expires</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="test-settings-row">
                <div className="settings-field">
                  <label htmlFor="requires-recording">Require Recording</label>
                  <div className="checkbox-inline">
                    <input
                      type="checkbox"
                      id="requires-recording"
                      checked={requiresRecording}
                      onChange={(e) => setRequiresRecording(e.target.checked)}
                    />
                    <label htmlFor="requires-recording">
                      Proctoring recording will be required for this test.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="questions-editor">
            <h2>Questions</h2>
            {questions.map((question, index) =>
              renderQuestionEditor(question, index)
            )}
            <div className="add-question-buttons">
              <button
                className="add-question-button mcq"
                onClick={() => addQuestion("MCQ")}>
                Add Multiple Choice Question
              </button>
              <button
                className="add-question-button checkbox"
                onClick={() => addQuestion("CHECKBOX")}>
                Add Checkbox Question
              </button>
              <button
                className="add-question-button coding"
                onClick={() => addQuestion("CODING")}>
                Add Coding Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCreator;

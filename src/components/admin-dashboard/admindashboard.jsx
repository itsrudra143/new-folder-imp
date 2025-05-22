import React, { useState, useEffect } from "react";
import "./admindashboard.css";
import { useAuth } from "../../context/AuthContext";
import { useTests, useUpdateTest, usePublishTest } from "../../hooks/useTests";
import { useAllTestAttempts } from "../../hooks/useTests";
import { useCalendarEvents } from "../../hooks/useCalendar";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminDashboard = () => {
  // Move ALL useState hooks to the top level - no conditional rendering of hooks
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [tests, setTests] = useState([]);
  const [showTestSettingsDialog, setShowTestSettingsDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [updatingTest, setUpdatingTest] = useState(false);
  const [editMaxAttempts, setEditMaxAttempts] = useState("");
  const [isUnlimitedAttempts, setIsUnlimitedAttempts] = useState(false);
  const [editExpiryDuration, setEditExpiryDuration] = useState("");
  const [editExpiryUnit, setEditExpiryUnit] = useState("days");
  const [isInfiniteExpiry, setIsInfiniteExpiry] = useState(true);
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [useStartDateTime, setUseStartDateTime] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [stats, setStats] = useState({
    totalPassed: 0,
    totalFailed: 0,
    passRate: 0,
    failRate: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for video recording modal
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [currentRecordingUrl, setCurrentRecordingUrl] = useState("");

  // Added state for dialog
  const [editRequiresRecording, setEditRequiresRecording] = useState(true);

  // Add any other useState hooks that might be inside conditional statements
  // This ensures all hooks are called in exactly the same order on every render

  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    data: testsData,
    isLoading: testsLoading,
    refetch: refetchTests,
  } = useTests();
  const { data: testAttempts, isLoading: attemptsLoading } =
    useAllTestAttempts();
  const { data: calendarEvents, isLoading: calendarLoading } =
    useCalendarEvents();
  const updateTestMutation = useUpdateTest();
  const publishTestMutation = usePublishTest();

  // Update local tests state when API data changes
  useEffect(() => {
    if (testsData) {
      setTests(testsData);
    }
  }, [testsData]);

  useEffect(() => {
    if (testAttempts) {
      // Process test attempts into student data
      const processedStudents = testAttempts.map((attempt) => ({
        id: attempt.id,
        name: `${attempt.user.firstName} ${attempt.user.lastName}`,
        rollNo: attempt.user.rollNumber || "N/A",
        group: attempt.user.batch || "N/A",
        marks: attempt.score || 0,
        total: 100, // Assuming total is 100
        testTitle: attempt.test.title,
        recordingUrl: attempt.recordingUrl,
      }));

      setStudentsData(processedStudents);

      // Calculate top performers
      const sortedStudents = [...processedStudents].sort(
        (a, b) => b.marks - a.marks
      );
      const top3 = sortedStudents.slice(0, 3).map((student, index) => ({
        rank: index + 1,
        name: student.name,
        rollNo: student.rollNo,
        group: student.group,
        score: `${Math.round(student.marks)}%`,
      }));

      setTopPerformers(top3);

      // Group by batch/group for chart data
      const groupedByBatch = {};
      processedStudents.forEach((student) => {
        const group = student.group;
        if (!groupedByBatch[group]) {
          groupedByBatch[group] = { group, passed: 0, failed: 0 };
        }

        if (student.marks >= 40) {
          groupedByBatch[group].passed += 1;
        } else {
          groupedByBatch[group].failed += 1;
        }
      });

      const chartDataArray = Object.values(groupedByBatch);
      setChartData(chartDataArray);

      // Calculate overall stats
      const totalPassed = processedStudents.filter((s) => s.marks >= 40).length;
      const totalFailed = processedStudents.length - totalPassed;
      const passRate =
        processedStudents.length > 0
          ? ((totalPassed / processedStudents.length) * 100).toFixed(1)
          : 0;
      const failRate =
        processedStudents.length > 0
          ? ((totalFailed / processedStudents.length) * 100).toFixed(1)
          : 0;

      setStats({
        totalPassed,
        totalFailed,
        passRate,
        failRate,
      });
    }
  }, [testAttempts]);

  const filteredStudents = studentsData.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.includes(searchTerm) ||
      student.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.testTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGradeColor = (marks) => {
    if (marks >= 90) return "#4CAF50";
    if (marks >= 80) return "#2196F3";
    if (marks >= 70) return "#FF9800";
    if (marks >= 60) return "#FFC107";
    return "#F44336";
  };

  const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#FFC107", "#F44336"];

  // Format date for display
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (testsLoading || attemptsLoading || calendarLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  // Function to handle test settings
  const openTestSettings = (test) => {
    // Make sure we're using the most up-to-date test data
    const currentTest = tests.find((t) => t.id === test.id) || test;
    setSelectedTest(currentTest);

    // Set max attempts
    setEditMaxAttempts(
      currentTest.maxAttempts === 20 ? "" : currentTest.maxAttempts.toString()
    );
    setIsUnlimitedAttempts(currentTest.maxAttempts === 20);

    // Set expiry duration and unit
    setEditExpiryDuration(
      currentTest.expiryDuration === null
        ? ""
        : currentTest.expiryDuration.toString()
    );
    setIsInfiniteExpiry(currentTest.expiryDuration === null);
    setEditExpiryUnit(currentTest.expiryUnit || "days");

    // Set start date and time
    if (currentTest.startTime) {
      const startDate = new Date(currentTest.startTime);
      setEditStartDate(startDate.toISOString().split("T")[0]);
      setEditStartTime(startDate.toTimeString().slice(0, 5));
      setUseStartDateTime(true);
    } else {
      setEditStartDate("");
      setEditStartTime("");
      setUseStartDateTime(false);
    }
    setEditRequiresRecording(
      typeof currentTest.requiresRecording === "boolean"
        ? currentTest.requiresRecording
        : true
    );

    setShowTestSettingsDialog(true);
  };

  // Function to close test settings dialog
  const closeTestSettings = () => {
    setShowTestSettingsDialog(false);
    setSelectedTest(null);
  };

  // Function to toggle test status (enable/disable)
  const toggleTestStatus = async () => {
    if (!selectedTest) return;

    try {
      setUpdatingTest(true);

      // Update the test status in the database
      await updateTestMutation.mutateAsync({
        id: selectedTest.id,
        testData: {
          isActive: !selectedTest.isActive,
        },
      });

      // Update the selected test in state
      const newIsActive = !selectedTest.isActive;
      setSelectedTest((prev) => ({
        ...prev,
        isActive: newIsActive,
      }));

      // Update the test in the local tests list immediately
      setTests((currentTests) =>
        currentTests.map((test) =>
          test.id === selectedTest.id
            ? { ...test, isActive: newIsActive }
            : test
        )
      );

      // Refetch tests in the background to ensure we have the latest data
      refetchTests();

      setUpdatingTest(false);
    } catch (error) {
      console.error("Error toggling test status:", error);
      setUpdatingTest(false);
    }
  };

  // Function to release test results
  const releaseTestResults = async () => {
    if (!selectedTest) return;

    try {
      setUpdatingTest(true);

      // Update the test results release status in the database
      await publishTestMutation.mutateAsync({
        id: selectedTest.id,
        scheduleData: {
          isPublished: true,
        },
      });

      // Update the selected test in state
      setSelectedTest((prev) => ({
        ...prev,
        isPublished: true,
        status: "COMPLETE",
      }));

      // Update the test in the local tests list immediately
      setTests((currentTests) =>
        currentTests.map((test) =>
          test.id === selectedTest.id
            ? { ...test, isPublished: true, status: "COMPLETE" }
            : test
        )
      );

      // Refetch tests in the background to ensure we have the latest data
      refetchTests();

      setUpdatingTest(false);
    } catch (error) {
      console.error("Error releasing test results:", error);
      setUpdatingTest(false);
    }
  };

  // Function to navigate to create test page
  const navigateToCreateTest = () => {
    navigate("/create-test");
  };

  // Function to update expiry duration
  const updateExpiryDuration = async () => {
    if (updatingTest) return;

    try {
      setUpdatingTest(true);

      const updatedTest = await updateTestMutation.mutateAsync({
        id: selectedTest.id,
        expiryDuration: isInfiniteExpiry ? null : parseInt(editExpiryDuration),
        expiryUnit: editExpiryUnit,
      });

      // Update local state
      setTests((prev) =>
        prev.map((t) =>
          t.id === updatedTest.id
            ? {
                ...t,
                expiryDuration: updatedTest.expiryDuration,
                expiryUnit: updatedTest.expiryUnit,
              }
            : t
        )
      );

      setSelectedTest({
        ...selectedTest,
        expiryDuration: updatedTest.expiryDuration,
        expiryUnit: updatedTest.expiryUnit,
      });

      // Show success message
      alert("Expiry duration updated successfully");
    } catch (error) {
      console.error("Error updating expiry duration:", error);
      alert("Failed to update expiry duration");
    } finally {
      setUpdatingTest(false);
    }
  };

  // Function to update start date and time
  const updateStartDateTime = async () => {
    if (updatingTest) return;

    try {
      setUpdatingTest(true);

      let startDateTime = null;
      if (useStartDateTime && editStartDate) {
        const dateStr = editStartDate;
        const timeStr = editStartTime || "00:00";
        startDateTime = new Date(`${dateStr}T${timeStr}`);

        // Validate the date is in the future
        if (startDateTime <= new Date()) {
          alert("Start date and time must be in the future");
          setUpdatingTest(false);
          return;
        }
      }

      const updatedTest = await updateTestMutation.mutateAsync({
        id: selectedTest.id,
        startTime: startDateTime,
      });

      // Update local state
      setTests((prev) =>
        prev.map((t) =>
          t.id === updatedTest.id
            ? {
                ...t,
                startTime: updatedTest.startTime,
              }
            : t
        )
      );

      setSelectedTest({
        ...selectedTest,
        startTime: updatedTest.startTime,
      });

      // Show success message
      alert("Start date and time updated successfully");
    } catch (error) {
      console.error("Error updating start date and time:", error);
      alert("Failed to update start date and time");
    } finally {
      setUpdatingTest(false);
    }
  };

  // Function to update max attempts
  const updateMaxAttempts = async () => {
    if (!selectedTest) return;

    try {
      setUpdatingTest(true);

      // Determine the max attempts value
      const maxAttemptsValue = isUnlimitedAttempts
        ? 20
        : parseInt(editMaxAttempts);

      // Update the test max attempts in the database
      await updateTestMutation.mutateAsync({
        id: selectedTest.id,
        testData: {
          maxAttempts: maxAttemptsValue,
        },
      });

      // Update the selected test in state
      setSelectedTest((prev) => ({
        ...prev,
        maxAttempts: maxAttemptsValue,
      }));

      // Update the test in the local tests list immediately
      setTests((currentTests) =>
        currentTests.map((test) =>
          test.id === selectedTest.id
            ? { ...test, maxAttempts: maxAttemptsValue }
            : test
        )
      );

      // Refetch tests in the background to ensure we have the latest data
      refetchTests();

      setUpdatingTest(false);
    } catch (error) {
      console.error("Error updating max attempts:", error);
      setUpdatingTest(false);
    }
  };

  // Function to update requiresRecording setting
  const updateRequiresRecording = async () => {
    if (!selectedTest || updatingTest) return;

    try {
      setUpdatingTest(true);
      await updateTestMutation.mutateAsync({
        id: selectedTest.id,
        testData: {
          requiresRecording: editRequiresRecording,
        },
      });

      setSelectedTest((prev) => ({
        ...prev,
        requiresRecording: editRequiresRecording,
      }));

      setTests((currentTests) =>
        currentTests.map((test) =>
          test.id === selectedTest.id
            ? { ...test, requiresRecording: editRequiresRecording }
            : test
        )
      );
      refetchTests(); // Refetch to ensure consistency
      alert("Recording requirement updated successfully.");
    } catch (error) {
      console.error("Error updating recording requirement:", error);
      alert("Failed to update recording requirement.");
    } finally {
      setUpdatingTest(false);
    }
  };

  // Calendar functions
  const daysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const getMonthName = (month) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[month];
  };

  // Helper function to determine event status based on test link
  const getEventStatus = (event) => {
    if (!event.test) {
      return null; // General event, no test status
    }
    if (event.test.isPublished) {
      return { text: "Completed", color: "primary" };
    }
    if (event.test.status === "EXPIRED") {
      return { text: "Expired", color: "warning" };
    }
    if (new Date(event.test.startTime) <= new Date()) {
      return { text: "Active/Upcoming", color: "success" }; // Or more specific if needed
    }
    // If none of the above, it's a future scheduled test
    return { text: "Scheduled", color: "info" };
  };

  // Filter events based on the 3-day rule for TEST events
  const filterAndPrepareEvents = (events) => {
    if (!events) return { byDate: {}, list: [] };

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const filteredEvents = events.filter((event) => {
      // Keep all non-test events
      if (!event.testId || !event.test) {
        return true;
      }
      // Keep test events that have started or are within the next 3 days
      const startTime = new Date(event.startTime);
      return startTime <= threeDaysFromNow;
    });

    // Prepare lookup for calendar day rendering (only for current month)
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const eventsByDateLookup = {};
    filteredEvents.forEach((event) => {
      const eventDate = new Date(event.startTime);
      if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
        const dateKey = eventDate.toDateString();
        if (!eventsByDateLookup[dateKey]) {
          eventsByDateLookup[dateKey] = [];
        }
        eventsByDateLookup[dateKey].push(event);
      }
    });

    return { byDate: eventsByDateLookup, list: filteredEvents };
  };

  // Use the prepared events
  const { byDate: eventsByDateForCalendar, list: preparedEventList } =
    filterAndPrepareEvents(calendarEvents);

  const renderCalendarDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Use the pre-filtered lookup for the current month view
    const eventsByDate = eventsByDateForCalendar;

    // Get number of days in current month
    const numDays = daysInMonth(month, year);

    // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = firstDayOfMonth(month, year);

    // Fill in empty spaces for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="calendar-day empty"></div>
      );
    }

    // Fill in the days of the month
    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toDateString();

      // Check if there are events on this day using the prepared lookup
      const eventsOnDay = eventsByDate[dateKey] || []; // Use the lookup

      days.push(
        <div
          key={dateKey}
          className={`calendar-day ${
            eventsOnDay.length > 0 ? "has-event" : ""
          } ${
            date.toDateString() === selectedDate.toDateString()
              ? "selected"
              : ""
          }`}
          onClick={() => setSelectedDate(date)}>
          <div className="day-number">{day}</div>
          {eventsOnDay.length > 0 && <div className="event-indicator"></div>}
        </div>
      );
    }

    return days;
  };

  const getEventsOnSelectedDate = () => {
    const selectedDateKey = selectedDate.toDateString();
    // Filter the prepared list for the selected date
    return preparedEventList.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDateKey;
    });
  };

  return (
    <div className="dashboard-container">
      {/* Top Greeting Section - Moved above sidebar */}
      <div className="top-greeting">
        <div className="greeting-container">
          <h1 className="greeting">
            Welcome back, {user?.firstName} {user?.lastName}
          </h1>
          <p className="quote">
            "Education is the passport to the future, for tomorrow belongs to
            those who prepare for it today."
          </p>
        </div>
        <div className="header-content">
          <div className="date-display">
            {formatDate()} | Exam Matrix Dashboard
          </div>
          <div className="header-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search student, roll no, group..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="notification-bell">
              <span>🔔</span>
              <div className="notification-badge">{tests?.length || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        {/* Sidebar - Now positioned below greeting */}
        <div className="sidebar">
          <div className="logo-container">
            <h3>Exam Matrix</h3>
          </div>
          <div className="nav-links">
            <button
              className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}>
              <span className="nav-icon">📊</span>
              Overview
            </button>
            <button
              className={`nav-link ${activeTab === "results" ? "active" : ""}`}
              onClick={() => setActiveTab("results")}>
              <span className="nav-icon">📝</span>
              Student Results
            </button>
            <button
              className={`nav-link ${
                activeTab === "analytics" ? "active" : ""
              }`}
              onClick={() => setActiveTab("analytics")}>
              <span className="nav-icon">📈</span>
              Analytics
            </button>
            <button
              className={`nav-link ${activeTab === "top" ? "active" : ""}`}
              onClick={() => setActiveTab("top")}>
              <span className="nav-icon">🏆</span>
              Top Performers
            </button>
            <button
              className={`nav-link ${activeTab === "tests" ? "active" : ""}`}
              onClick={() => setActiveTab("tests")}>
              <span className="nav-icon">📋</span>
              Manage Tests
            </button>
            <button
              className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}>
              <span className="nav-icon">📅</span>
              Calendar
            </button>
          </div>
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-details">
                <p className="user-name">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="user-role">Administrator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Positioned after sidebar */}
        <div className="main-content">
          <main className="dashboard-main">
            {activeTab === "overview" && (
              <div className="overview-content">
                <div className="subject-info">
                  <div className="subject-card">
                    <div className="subject-details">
                      <div className="subject-icon">📚</div>
                      <div className="subject-text">
                        <p>Total Tests: {tests?.length || 0}</p>
                        <p>Total Attempts: {testAttempts?.length || 0}</p>
                        <p>Date: {formatDate()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="chart-container full-width">
                  <h2>📊 Group Performance Analysis</h2>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height={400}>
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 20,
                        }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="group" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="passed"
                          fill="#4CAF50"
                          name="Passed"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="failed"
                          fill="#FF5252"
                          name="Failed"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data">
                      No test data available to display chart
                    </div>
                  )}
                </div>
                <div className="stats-container">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="content">
                        <h3>Students Passed ✅</h3>
                        <p className="stats-number">{stats.totalPassed}</p>
                        <p className="trend positive">{stats.passRate}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="content">
                        <h3>Students Failed ❌</h3>
                        <p className="stats-number">{stats.totalFailed}</p>
                        <p className="trend negative">{stats.failRate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "top" && (
              <div className="top-performers">
                <h2>🏆 Top Performers</h2>
                <div className="performer-cards">
                  {topPerformers.length > 0 ? (
                    topPerformers.map(
                      ({ rank, name, rollNo, group, score }) => (
                        <div
                          className="performer-card"
                          key={rank}>
                          <div className="card-content">
                            <div className="rank-emoji">
                              {rank === 1 && "🥇"}
                              {rank === 2 && "🥈"}
                              {rank === 3 && "🥉"}
                            </div>
                            <div className="performer-info">
                              <h3>{name}</h3>
                              <p className="roll-no">Roll No: {rollNo}</p>
                              <p className="group">Group: {group}</p>
                              <div className="score-badge">{score}</div>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="no-data">
                      No test data available to display top performers
                    </div>
                  )}
                </div>

                <div className="performance-insights">
                  <h3>Performance Insights</h3>
                  <div className="insights-grid">
                    <div className="insight-card">
                      <div className="insight-icon">🚀</div>
                      <div className="insight-content">
                        <h4>Test Participation</h4>
                        <p>
                          {testAttempts?.length || 0} total test attempts
                          recorded
                        </p>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon">📊</div>
                      <div className="insight-content">
                        <h4>Group Performance</h4>
                        <p>
                          {chartData.length > 0
                            ? `${chartData.length} groups participated in tests`
                            : "No group data available"}
                        </p>
                      </div>
                    </div>
                    <div className="insight-card">
                      <div className="insight-icon">⚡</div>
                      <div className="insight-content">
                        <h4>Average Score</h4>
                        <p>
                          {studentsData.length > 0
                            ? `${Math.round(
                                studentsData.reduce(
                                  (sum, s) => sum + s.marks,
                                  0
                                ) / studentsData.length
                              )}% average score`
                            : "No data available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "results" && (
              <div className="all-results">
                <h2>📝 All Students Results</h2>

                <div className="filter-controls">
                  <div className="filter-dropdown">
                    <select className="filter-select">
                      <option value="all">All Groups</option>
                      {Array.from(
                        new Set(studentsData.map((s) => s.group))
                      ).map((group) => (
                        <option
                          key={group}
                          value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-dropdown">
                    <select className="filter-select">
                      <option value="all">All Grades</option>
                      <option value="A">A Grade (90-100)</option>
                      <option value="B">B Grade (80-89)</option>
                      <option value="C">C Grade (70-79)</option>
                    </select>
                  </div>
                  <div className="filter-dropdown">
                    <select className="filter-select">
                      <option value="marks">Sort by Marks</option>
                      <option value="name">Sort by Name</option>
                      <option value="group">Sort by Group</option>
                    </select>
                  </div>
                </div>

                <div className="results-table">
                  {filteredStudents.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Sno.</th>
                          <th>Name</th>
                          <th>Roll Number</th>
                          <th>Group</th>
                          <th>Test</th>
                          <th>Marks</th>
                          <th>Grade</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, index) => (
                          <tr key={student.id}>
                            <td>{index + 1}</td>
                            <td>{student.name}</td>
                            <td>{student.rollNo}</td>
                            <td>{student.group}</td>
                            <td>{student.testTitle || "N/A"}</td>
                            <td>
                              <div className="marks-container">
                                <div
                                  className="marks-bar"
                                  style={{
                                    width: `${student.marks}%`,
                                    backgroundColor: getGradeColor(
                                      student.marks
                                    ),
                                  }}></div>
                                <span>
                                  {Math.round(student.marks)}/{student.total}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className="grade-badge"
                                style={{
                                  backgroundColor: getGradeColor(student.marks),
                                }}>
                                {student.marks >= 90
                                  ? "A"
                                  : student.marks >= 80
                                  ? "B"
                                  : student.marks >= 70
                                  ? "C"
                                  : student.marks >= 60
                                  ? "D"
                                  : student.marks >= 40
                                  ? "E"
                                  : "F"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`status-badge ${
                                  student.marks >= 40 ? "passed" : "failed"
                                }`}>
                                {student.marks >= 40 ? "PASSED" : "FAILED"}
                              </span>
                            </td>
                            <td>
                              {student.recordingUrl && (
                                <button
                                  className="action-button view-recording-button"
                                  onClick={() => {
                                    setCurrentRecordingUrl(
                                      student.recordingUrl
                                    );
                                    setShowRecordingModal(true);
                                  }}>
                                  View Recording
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-data">No test results found</div>
                  )}
                </div>

                {filteredStudents.length > 10 && (
                  <div className="pagination">
                    <button className="pagination-button active">1</button>
                    <button className="pagination-button">2</button>
                    <button className="pagination-button">3</button>
                    <button className="pagination-button">...</button>
                    <button className="pagination-button">
                      {Math.ceil(filteredStudents.length / 10)}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="analytics-section">
                <h2>📈 Advanced Analytics</h2>

                <div className="analytics-cards">
                  <div className="analytics-card">
                    <h3>Performance Summary</h3>
                    <p className="analytics-insight">
                      {stats.passRate}% overall pass rate across all tests
                    </p>
                    {stats.passRate < 70 && (
                      <p className="analytics-insight negative">
                        Pass rate is below target of 70%
                      </p>
                    )}
                    {stats.passRate >= 70 && (
                      <p className="analytics-insight positive">
                        Pass rate is above target of 70%
                      </p>
                    )}
                  </div>
                  <div className="analytics-card">
                    <h3>Test Statistics</h3>
                    <p className="analytics-insight">
                      {tests?.length || 0} total tests created
                    </p>
                    <p className="analytics-insight">
                      {testAttempts?.length || 0} total test attempts
                    </p>
                  </div>
                  <div className="analytics-card">
                    <h3>Student Engagement</h3>
                    <p className="analytics-insight">
                      {new Set(studentsData.map((s) => s.name)).size} unique
                      students took tests
                    </p>
                    <p className="analytics-insight">
                      {Math.round(
                        testAttempts?.length /
                          (new Set(studentsData.map((s) => s.name)).size || 1)
                      )}{" "}
                      tests per student on average
                    </p>
                  </div>
                </div>

                <div className="chart-container">
                  <h3>Score Distribution</h3>
                  <div className="difficulty-bars">
                    {[
                      { label: "90-100%", range: [90, 100], class: "easy" },
                      { label: "80-89%", range: [80, 89], class: "easy" },
                      { label: "70-79%", range: [70, 79], class: "medium" },
                      { label: "60-69%", range: [60, 69], class: "medium" },
                      { label: "50-59%", range: [50, 59], class: "hard" },
                      { label: "40-49%", range: [40, 49], class: "hard" },
                      {
                        label: "Below 40%",
                        range: [0, 39],
                        class: "very-hard",
                      },
                    ].map((range) => {
                      const count = studentsData.filter(
                        (s) =>
                          s.marks >= range.range[0] && s.marks <= range.range[1]
                      ).length;
                      const percentage =
                        studentsData.length > 0
                          ? (count / studentsData.length) * 100
                          : 0;

                      return (
                        <div
                          className="difficulty-bar-container"
                          key={range.label}>
                          <div className="difficulty-label">{range.label}</div>
                          <div className="difficulty-track">
                            <div
                              className={`difficulty-fill ${range.class}`}
                              style={{ width: `${percentage}%` }}></div>
                          </div>
                          <div className="difficulty-value">
                            {count} students ({Math.round(percentage)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="recommendation-section">
                  <h3>Recommendations</h3>
                  <div className="recommendation-cards">
                    <div className="recommendation-card">
                      <div className="recommendation-icon">📚</div>
                      <div className="recommendation-content">
                        <h4>Focus Areas</h4>
                        <p>
                          {stats.failRate > 30
                            ? "Consider additional review sessions to improve pass rate"
                            : "Continue with current teaching approach"}
                        </p>
                      </div>
                    </div>
                    <div className="recommendation-card">
                      <div className="recommendation-icon">👥</div>
                      <div className="recommendation-content">
                        <h4>Group Study</h4>
                        <p>
                          {chartData.length > 0 &&
                          chartData.some((g) => g.failed > g.passed)
                            ? "Some groups need additional support - consider peer learning"
                            : "All groups are performing well"}
                        </p>
                      </div>
                    </div>
                    <div className="recommendation-card">
                      <div className="recommendation-icon">🎯</div>
                      <div className="recommendation-content">
                        <h4>Test Strategy</h4>
                        <p>
                          {tests?.length < 5
                            ? "Create more tests to gather better performance data"
                            : "Sufficient tests available - focus on quality"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tests" && (
              <div className="tests-section">
                <div className="section-header">
                  <h2>📋 Manage Tests</h2>
                  <button
                    className="create-test-button"
                    onClick={navigateToCreateTest}>
                    <span>+</span> Create New Test
                  </button>
                </div>

                {tests && tests.length > 0 ? (
                  <div className="tests-list">
                    {tests.map((test) => (
                      <div
                        key={test.id}
                        className="test-card">
                        <div className="test-info">
                          <h3>{test.title}</h3>
                          <div className="test-details">
                            <span className="test-detail">
                              <span className="detail-icon">⏱️</span>
                              {test.duration} mins
                            </span>
                            <span className="test-detail">
                              <span className="detail-icon">❓</span>
                              {test._count?.questions || 0} questions
                            </span>
                            <span className="test-detail">
                              <span className="detail-icon">🔄</span>
                              {test.maxAttempts === 20
                                ? "Unlimited"
                                : test.maxAttempts}{" "}
                              attempts
                            </span>
                            <span className="test-detail">
                              <span className="detail-icon">📅</span>
                              {test.expiryDuration
                                ? `${test.expiryDuration} ${
                                    test.expiryUnit || "days"
                                  }`
                                : "No expiry"}
                            </span>

                            {test.startTime && (
                              <span className="test-detail">
                                <span className="detail-icon">🕒</span>
                                Starts:{" "}
                                {new Date(test.startTime).toLocaleDateString()}
                              </span>
                            )}
                            <span
                              className={`test-status ${
                                test.isPublished
                                  ? "complete"
                                  : test.status === "EXPIRED"
                                  ? "expired"
                                  : test.isActive
                                  ? "active"
                                  : "inactive"
                              }`}>
                              {test.isPublished
                                ? "Complete"
                                : test.status === "EXPIRED"
                                ? "Expired"
                                : test.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                          <p className="test-description">
                            {test.description?.length > 100
                              ? test.description.substring(0, 100) + "..."
                              : test.description || "No description provided"}
                          </p>
                        </div>
                        <div className="test-actions">
                          <button
                            className="settings-button"
                            onClick={() => openTestSettings(test)}>
                            ⚙️ Settings
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-tests">
                    <p>
                      No tests created yet. Click the button above to create
                      your first test.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="calendar-section">
                <h2>📅 Event Calendar</h2>

                <div className="calendar-container">
                  <div className="calendar-header">
                    <button
                      className="calendar-nav-btn"
                      onClick={prevMonth}>
                      ❮
                    </button>
                    <h3>
                      {getMonthName(currentMonth.getMonth())}{" "}
                      {currentMonth.getFullYear()}
                    </h3>
                    <button
                      className="calendar-nav-btn"
                      onClick={nextMonth}>
                      ❯
                    </button>
                  </div>

                  <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="calendar-days">{renderCalendarDays()}</div>
                </div>

                {calendarLoading && (
                  <div className="loading-small">Loading events...</div>
                )}

                <div className="events-list">
                  <h3>Events on {selectedDate.toLocaleDateString()}</h3>
                  {!calendarLoading && getEventsOnSelectedDate().length > 0 ? (
                    getEventsOnSelectedDate().map((event) => {
                      const eventStatus = getEventStatus(event);
                      return (
                        <div
                          className="event-card"
                          key={event.id}>
                          <div className="event-header">
                            <span className="event-title">{event.title}</span>
                            {eventStatus && (
                              <span
                                className={`event-status-badge ${eventStatus.color}`}>
                                {eventStatus.text}
                              </span>
                            )}
                          </div>
                          {event.test?.title && event.testId !== event.id && (
                            <div className="event-test-link">
                              Related Test: {event.test.title}
                            </div>
                          )}
                          {event.description && (
                            <div className="event-description">
                              {event.description}
                            </div>
                          )}
                          <div className="event-date">
                            {new Date(event.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {event.endTime &&
                              ` - ${new Date(event.endTime).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}`}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-events">
                      {!calendarLoading
                        ? "No events scheduled for this date."
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Test Settings Dialog */}
      {showTestSettingsDialog && selectedTest && (
        <div className="dialog-overlay">
          <div className="dialog-container">
            <div className="dialog-header">
              <h3>Test Settings: {selectedTest.title}</h3>
              <button
                className="close-button"
                onClick={closeTestSettings}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              {selectedTest.isPublished && (
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Test Status</h4>
                    <p className="status-complete">
                      This test is complete and results are published. Settings
                      cannot be modified.
                    </p>
                  </div>
                </div>
              )}

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Test Status</h4>
                  <p>Enable or disable this test for students</p>
                </div>
                <div className="setting-action">
                  <button
                    className={`toggle-button ${
                      selectedTest.isActive ? "active" : "inactive"
                    }`}
                    onClick={toggleTestStatus}
                    disabled={updatingTest || selectedTest.isPublished}>
                    {updatingTest
                      ? "Updating..."
                      : selectedTest.isActive
                      ? "Enabled"
                      : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Test Results</h4>
                  <p>Release results to all students who attempted this test</p>
                </div>
                <div className="setting-action">
                  <button
                    className={`action-button ${
                      selectedTest.isPublished ? "disabled" : ""
                    }`}
                    onClick={releaseTestResults}
                    disabled={selectedTest.isPublished || updatingTest}>
                    {updatingTest
                      ? "Updating..."
                      : selectedTest.isPublished
                      ? "Results Published"
                      : "Publish Results"}
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Test Analytics</h4>
                  <p>View detailed analytics for this test</p>
                </div>
                <div className="setting-action">
                  <button className="action-button">View Analytics</button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Test Expiry</h4>
                  <p>Set the number of days after which the test will expire</p>
                </div>
                <div className="setting-action expiry-settings">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="infinite-expiry"
                      checked={isInfiniteExpiry}
                      onChange={(e) => setIsInfiniteExpiry(e.target.checked)}
                      disabled={updatingTest || selectedTest.isPublished}
                    />
                    <label htmlFor="infinite-expiry">No expiry</label>
                  </div>
                  {!isInfiniteExpiry && (
                    <div className="expiry-input">
                      <input
                        type="number"
                        value={editExpiryDuration}
                        onChange={(e) => setEditExpiryDuration(e.target.value)}
                        min="1"
                        disabled={
                          isInfiniteExpiry ||
                          updatingTest ||
                          selectedTest.isPublished
                        }
                        className="number-input"
                      />
                      <select
                        value={editExpiryUnit}
                        onChange={(e) => setEditExpiryUnit(e.target.value)}
                        disabled={
                          isInfiniteExpiry ||
                          updatingTest ||
                          selectedTest.isPublished
                        }
                        className="expiry-unit-select">
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  )}
                  <button
                    className="action-button"
                    onClick={updateExpiryDuration}
                    disabled={updatingTest || selectedTest.isPublished}>
                    {updatingTest ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Start Date & Time</h4>
                  <p>Schedule when the test will become available</p>
                </div>
                <div className="setting-action start-date-settings">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="use-start-date"
                      checked={useStartDateTime}
                      onChange={(e) => setUseStartDateTime(e.target.checked)}
                      disabled={updatingTest || selectedTest.isPublished}
                    />
                    <label htmlFor="use-start-date">Schedule test start</label>
                  </div>
                  {useStartDateTime && (
                    <div className="date-time-inputs">
                      <div className="date-input">
                        <label htmlFor="start-date">Date</label>
                        <input
                          type="date"
                          id="start-date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          disabled={updatingTest || selectedTest.isPublished}
                        />
                      </div>
                      <div className="time-input">
                        <label htmlFor="start-time">Time</label>
                        <input
                          type="time"
                          id="start-time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          disabled={updatingTest || selectedTest.isPublished}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    className="action-button"
                    onClick={updateStartDateTime}
                    disabled={
                      updatingTest ||
                      selectedTest.isPublished ||
                      !useStartDateTime ||
                      !editStartDate
                    }>
                    {updatingTest ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>

              {/* Max Attempts Setting */}
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Maximum Attempts</h4>
                  <p>Set how many times a student can attempt the test.</p>
                </div>
                <div className="setting-action max-attempts-settings">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="unlimited-attempts"
                      checked={isUnlimitedAttempts}
                      onChange={(e) => setIsUnlimitedAttempts(e.target.checked)}
                      disabled={updatingTest || selectedTest.isPublished}
                    />
                    <label htmlFor="unlimited-attempts">
                      Unlimited attempts
                    </label>
                  </div>
                  {!isUnlimitedAttempts && (
                    <div className="attempts-input">
                      <input
                        type="number"
                        value={editMaxAttempts}
                        onChange={(e) => setEditMaxAttempts(e.target.value)}
                        min="1"
                        disabled={
                          isUnlimitedAttempts ||
                          updatingTest ||
                          selectedTest.isPublished
                        }
                        className="number-input attempts-number-input"
                      />
                      <label>attempts allowed</label>
                    </div>
                  )}
                  {/* Added Update button for Max Attempts */}
                  <button
                    className="action-button"
                    onClick={updateMaxAttempts} // Attach the function here
                    disabled={
                      updatingTest ||
                      selectedTest.isPublished ||
                      (!isUnlimitedAttempts && !editMaxAttempts)
                    }>
                    {updatingTest ? "Updating..." : "Update Attempts"}
                  </button>
                </div>
              </div>

              {/* Requires Recording Setting */}
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Require Recording</h4>
                  <p>
                    Specify if proctoring recording is mandatory for this test.
                  </p>
                </div>
                <div className="setting-action requires-recording-settings">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="edit-requires-recording"
                      checked={editRequiresRecording}
                      onChange={(e) =>
                        setEditRequiresRecording(e.target.checked)
                      }
                      disabled={updatingTest || selectedTest.isPublished}
                    />
                    <label htmlFor="edit-requires-recording">
                      Recording Required
                    </label>
                  </div>
                  <button
                    className="action-button"
                    onClick={updateRequiresRecording}
                    disabled={updatingTest || selectedTest.isPublished}>
                    {updatingTest ? "Updating..." : "Update Recording Setting"}
                  </button>
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button
                className="cancel-button"
                onClick={closeTestSettings}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Player Modal */}
      {showRecordingModal && (
        <div className="recording-modal-overlay">
          <div className="recording-modal-content">
            <h3>Test Recording</h3>
            <video
              src={currentRecordingUrl}
              controls
              width="100%"
              height="auto">
              Your browser does not support the video tag.
            </video>
            <div className="recording-modal-actions">
              <a
                href={currentRecordingUrl}
                download
                className="action-button download-button">
                Download Recording
              </a>
              <button
                className="action-button cancel-button"
                onClick={() => setShowRecordingModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

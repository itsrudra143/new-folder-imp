import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClass, useClassTests } from "../../hooks/useClasses";
import { useCalendarEvents } from "../../hooks/useCalendar";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventIcon from "@mui/icons-material/Event";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: classData, isLoading: isClassLoading } = useClass(id);
  const { data: classTests, isLoading: isTestsLoading } = useClassTests(id, {
    refetchInterval: 60000, // Refetch every minute to check for test activation
  });
  const { data: generalCalendarEvents, isLoading: calendarLoading } =
    useCalendarEvents();

  // Calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Combine loading states
  const isLoading = isClassLoading || isTestsLoading || calendarLoading;

  // Helper function to determine event status based on test link
  const getEventStatus = (event) => {
    // Only applies to events of type 'test' generated from classTests or generalEvents with test link
    if (!event.originalTest) {
      return null;
    }
    const test = event.originalTest;
    if (test.isPublished) {
      return {
        text: "Completed",
        color: "primary",
        icon: <CheckCircleIcon fontSize="inherit" />,
      };
    }
    if (test.status === "EXPIRED") {
      return {
        text: "Expired",
        color: "warning",
        icon: <CancelIcon fontSize="inherit" />,
      };
    }
    // Check if the test is active (startTime passed)
    const startTime = new Date(test.startTime);
    if (startTime <= new Date()) {
      return {
        text: "Active",
        color: "success",
        icon: <PlayCircleOutlineIcon fontSize="inherit" />,
      };
    }
    // If none of the above, it's scheduled for the future
    return {
      text: "Scheduled",
      color: "info",
      icon: <ScheduleIcon fontSize="inherit" />,
    };
  };

  // Memoize the combined and filtered list of calendar events and upcoming tests
  const combinedCalendarEvents = useMemo(() => {
    // Return empty array if data is loading to prevent errors in calculation
    if (isClassLoading || isTestsLoading || calendarLoading) {
      return [];
    }

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const upcomingTests = (classTests || [])
      .filter((test) => {
        if (!test?.startTime) return false; // Ignore tests without a start time
        const startTime = new Date(test.startTime);
        // Keep tests that have started or are within the next 3 days
        return startTime <= threeDaysFromNow;
      })
      .map((test) => ({
        id: `test-${test.id}`,
        title: test.title,
        startTime: test.startTime,
        endTime: null,
        description: test.description || "Class Test",
        type: "test",
        duration: test.duration,
        testId: test.id,
        originalTest: test, // Keep reference to original test for status check
      }));

    // General calendar events don't need the 3-day filtering
    const generalEvents = (generalCalendarEvents || []).map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.description,
      type: "event",
      testId: event.testId,
      isAllDay: event.isAllDay,
      // Include linked test status if available from the backend fetch
      originalTest: event.test || null,
    }));

    // Combine and sort by start time
    return [...upcomingTests, ...generalEvents].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
    // Depend on loading states as well, so it recalculates when loading finishes
  }, [
    classTests,
    generalCalendarEvents,
    isClassLoading,
    isTestsLoading,
    calendarLoading,
  ]);

  // Prepare events for calendar grid rendering (memoized)
  const eventsByDateForCalendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const eventsByDate = {};
    // Use combinedCalendarEvents directly as it's guaranteed to be an array
    combinedCalendarEvents.forEach((event) => {
      const eventDate = new Date(event.startTime);
      // Only include events for the current month view
      if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
        const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      }
    });
    return eventsByDate;
    // No need to depend on loading states here, as it depends on combinedCalendarEvents which handles loading
  }, [currentMonth, combinedCalendarEvents]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!classData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h5"
          color="error">
          Class not found
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/student/classes")}
          sx={{ mt: 2 }}>
          Back to Classes
        </Button>
      </Box>
    );
  }

  // Calendar helper functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthStartDay = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Function to get events for the selected month (for the list view in dialog)
  const getEventsForCurrentMonthView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return combinedCalendarEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const monthStartDay = getMonthStartDay(year, month); // 0 for Sunday

    const allCells = [];

    // Use the memoized map for the current month
    const eventsByDate = eventsByDateForCalendarGrid;

    // Add blank cells for days before the start of the month
    for (let i = 0; i < monthStartDay; i++) {
      allCells.push(<TableCell key={`empty-lead-${i}`} />);
    }

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      const eventsOnDay = eventsByDate[dateKey] || [];
      const hasEvents = eventsOnDay.length > 0;

      allCells.push(
        <TableCell
          key={`day-${day}`}
          align="center"
          sx={{
            position: "relative",
            height: "60px", // Adjust as needed or use theme spacing
            padding: "2px",
            border: "1px solid #ddd",
            ...(hasEvents && {
              backgroundColor: "rgba(25, 118, 210, 0.05)", // Lighter background
              border: "1px solid rgba(25, 118, 210, 0.2)",
            }),
          }}>
          <Typography variant="body2">{day}</Typography>
          {hasEvents && (
            <Box
              sx={{
                mt: 0.5,
                display: "flex",
                justifyContent: "center",
              }}>
              <Tooltip
                title={`${eventsOnDay.length} event${
                  eventsOnDay.length > 1 ? "s" : ""
                } on this day`}>
                <Chip
                  size="small"
                  icon={<EventIcon sx={{ fontSize: "12px !important" }} />}
                  label={eventsOnDay.length}
                  color="primary"
                  sx={{ fontSize: "0.7rem", height: "20px", cursor: "default" }}
                />
              </Tooltip>
            </Box>
          )}
        </TableCell>
      );
    }

    // Add blank cells for days after the end of the month to fill the grid
    const totalCellsInGridSoFar = monthStartDay + daysInMonth;
    const remainingCellsToFillWeek =
      totalCellsInGridSoFar % 7 === 0 ? 0 : 7 - (totalCellsInGridSoFar % 7);

    for (let i = 0; i < remainingCellsToFillWeek; i++) {
      allCells.push(<TableCell key={`empty-trail-${i}`} />);
    }

    // Group cells into rows
    const rows = [];
    for (let i = 0; i < allCells.length; i += 7) {
      const weekCells = allCells.slice(i, i + 7);
      // Ensure unique key for TableRow, e.g., based on the first day's index or a week number
      rows.push(<TableRow key={`week-${i / 7}`}>{weekCells}</TableRow>);
    }

    return rows;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton
          onClick={() => navigate("/student/classes")}
          sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          component="h1">
          {classData.name}
        </Typography>
      </Box>

      <Grid
        container
        spacing={3}>
        <Grid
          item
          xs={12}
          md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h5"
              gutterBottom>
              Available Tests
            </Typography>

            {isTestsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : classTests && classTests.length > 0 ? (
              <List>
                {/* Upcoming Tests Section */}
                {classTests.some(
                  (test) =>
                    !test.isActive &&
                    test.startTime &&
                    new Date(test.startTime) > new Date() &&
                    test.status !== "EXPIRED"
                ) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "info.main",
                        mb: 1,
                      }}>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: "info.light",
                          color: "info.main",
                          p: 0.5,
                          borderRadius: "50%",
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                        }}>
                        📅
                      </Box>
                      Upcoming Tests
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {classTests
                      .filter(
                        (test) =>
                          !test.isActive &&
                          test.startTime &&
                          new Date(test.startTime) > new Date() &&
                          test.status !== "EXPIRED"
                      )
                      .sort(
                        (a, b) => new Date(a.startTime) - new Date(b.startTime)
                      )
                      .map((test) => (
                        <Paper
                          key={test.id}
                          elevation={1}
                          sx={{
                            mb: 2,
                            overflow: "hidden",
                            borderLeft: "4px solid",
                            borderColor: "info.main",
                          }}>
                          <ListItemButton
                            onClick={() =>
                              navigate(`/student/tests/${test.id}`)
                            }
                            sx={{
                              p: 2,
                              transition: "all 0.2s",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                              },
                            }}>
                            <ListItemIcon>
                              <AssignmentIcon
                                color="info"
                                fontSize="large"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}>
                                  <Typography
                                    variant="h6"
                                    component="div">
                                    {test.title}
                                  </Typography>
                                  <Tooltip title="Test is scheduled for the future">
                                    <Chip
                                      label="Upcoming"
                                      color="info"
                                      size="small"
                                      sx={{ fontWeight: "bold" }}
                                    />
                                  </Tooltip>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    paragraph>
                                    {test.description ||
                                      "No description provided"}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 2,
                                    }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <AccessTimeIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test.duration} minutes
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <HelpOutlineIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test._count?.questions || 0} questions
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        bgcolor: "info.light",
                                        color: "info.contrastText",
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: "0.75rem",
                                      }}>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: "bold" }}>
                                        Scheduled:{" "}
                                        {new Date(
                                          test.startTime
                                        ).toLocaleDateString()}{" "}
                                        at{" "}
                                        {new Date(
                                          test.startTime
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              }
                            />
                            <Button
                              variant="outlined"
                              color="info"
                              sx={{ ml: 2 }}
                              disabled={true}>
                              Upcoming
                            </Button>
                          </ListItemButton>
                        </Paper>
                      ))}
                  </Box>
                )}

                {/* Active Tests Section */}
                {classTests.some(
                  (test) => test.isActive && !test.isPublished
                ) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "success.main",
                        mb: 1,
                      }}>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: "success.light",
                          color: "success.main",
                          p: 0.5,
                          borderRadius: "50%",
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                        }}>
                        ✅
                      </Box>
                      Active Tests
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {classTests
                      .filter((test) => test.isActive && !test.isPublished)
                      .map((test) => (
                        <Paper
                          key={test.id}
                          elevation={1}
                          sx={{
                            mb: 2,
                            overflow: "hidden",
                            borderLeft: "4px solid",
                            borderColor: "success.main",
                          }}>
                          <ListItemButton
                            onClick={() =>
                              navigate(`/student/tests/${test.id}`)
                            }
                            sx={{
                              p: 2,
                              transition: "all 0.2s",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                              },
                            }}>
                            <ListItemIcon>
                              <AssignmentIcon
                                color="success"
                                fontSize="large"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}>
                                  <Typography
                                    variant="h6"
                                    component="div">
                                    {test.title}
                                  </Typography>
                                  <Tooltip title="Test is active and available">
                                    <Chip
                                      label="Active"
                                      color="success"
                                      size="small"
                                      sx={{ fontWeight: "bold" }}
                                    />
                                  </Tooltip>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    paragraph>
                                    {test.description ||
                                      "No description provided"}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 2,
                                    }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <AccessTimeIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test.duration} minutes
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <HelpOutlineIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test._count?.questions || 0} questions
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              }
                            />
                            <Button
                              variant="contained"
                              color="success"
                              sx={{ ml: 2 }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent ListItemButton click
                                navigate(`/student/tests/${test.id}`);
                              }}>
                              Start Test
                            </Button>
                          </ListItemButton>
                        </Paper>
                      ))}
                  </Box>
                )}

                {/* Completed Tests Section */}
                {classTests.some((test) => test.isPublished) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "primary.main",
                        mb: 1,
                      }}>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: "primary.light",
                          color: "primary.main",
                          p: 0.5,
                          borderRadius: "50%",
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                        }}>
                        🏆
                      </Box>
                      Completed Tests
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {classTests
                      .filter((test) => test.isPublished)
                      .map((test) => (
                        <Paper
                          key={test.id}
                          elevation={1}
                          sx={{
                            mb: 2,
                            overflow: "hidden",
                            borderLeft: "4px solid",
                            borderColor: "primary.main",
                          }}>
                          <ListItemButton
                            onClick={() =>
                              navigate(`/student/tests/${test.id}`)
                            }
                            sx={{
                              p: 2,
                              transition: "all 0.2s",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                              },
                            }}>
                            <ListItemIcon>
                              <AssignmentIcon
                                color="primary"
                                fontSize="large"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}>
                                  <Typography
                                    variant="h6"
                                    component="div">
                                    {test.title}
                                  </Typography>
                                  <Tooltip title="Test is complete and results are available">
                                    <Chip
                                      label="Complete"
                                      color="primary"
                                      size="small"
                                      sx={{ fontWeight: "bold" }}
                                    />
                                  </Tooltip>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    paragraph>
                                    {test.description ||
                                      "No description provided"}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 2,
                                    }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <AccessTimeIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test.duration} minutes
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <HelpOutlineIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test._count?.questions || 0} questions
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              }
                            />
                            <Button
                              variant="contained"
                              color="primary"
                              sx={{ ml: 2 }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent ListItemButton click
                                navigate(`/student/tests/${test.id}`);
                              }}>
                              View Results
                            </Button>
                          </ListItemButton>
                        </Paper>
                      ))}
                  </Box>
                )}

                {/* Expired Tests Section */}
                {classTests.some((test) => test.status === "EXPIRED") && (
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "warning.dark",
                        mb: 1,
                      }}>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: "warning.light",
                          color: "warning.dark",
                          p: 0.5,
                          borderRadius: "50%",
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                        }}>
                        ⏱️
                      </Box>
                      Expired Tests
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {classTests
                      .filter((test) => test.status === "EXPIRED")
                      .map((test) => (
                        <Paper
                          key={test.id}
                          elevation={1}
                          sx={{
                            mb: 2,
                            overflow: "hidden",
                            borderLeft: "4px solid",
                            borderColor: "warning.dark",
                            opacity: 0.7,
                          }}>
                          <ListItemButton
                            sx={{
                              p: 2,
                              transition: "all 0.2s",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                              },
                            }}>
                            <ListItemIcon>
                              <AssignmentIcon
                                color="warning"
                                fontSize="large"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}>
                                  <Typography
                                    variant="h6"
                                    component="div">
                                    {test.title}
                                  </Typography>
                                  <Tooltip title="Test has expired and is no longer available">
                                    <Chip
                                      label="Expired"
                                      color="warning"
                                      size="small"
                                      sx={{
                                        fontWeight: "bold",
                                        bgcolor: "#f59e0b",
                                        color: "white",
                                      }}
                                    />
                                  </Tooltip>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    paragraph>
                                    {test.description ||
                                      "No description provided"}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 2,
                                    }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <AccessTimeIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test.duration} minutes
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}>
                                      <HelpOutlineIcon
                                        fontSize="small"
                                        sx={{
                                          mr: 0.5,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary">
                                        {test._count?.questions || 0} questions
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              }
                            />
                            <Button
                              variant="outlined"
                              color="warning"
                              sx={{ ml: 2 }}
                              disabled={true}>
                              Expired
                            </Button>
                          </ListItemButton>
                        </Paper>
                      ))}
                  </Box>
                )}

                {/* Show message if no tests in any category */}
                {!classTests.some(
                  (test) =>
                    test.isActive ||
                    test.isPublished ||
                    test.status === "EXPIRED" ||
                    (!test.isActive &&
                      test.startTime &&
                      new Date(test.startTime) > new Date() &&
                      test.status !== "EXPIRED")
                ) && (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <AssignmentIcon
                      sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary">
                      No tests available in this class yet
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary">
                      Your teacher hasn't assigned any tests to this class yet.
                    </Typography>
                  </Box>
                )}
              </List>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <AssignmentIcon
                  sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                />
                <Typography
                  variant="h6"
                  color="text.secondary">
                  No tests available in this class yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Your teacher hasn't assigned any tests to this class yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom>
                Class Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {classData.description || "No description provided"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Teacher
                </Typography>
                <Typography variant="body1">
                  {classData.createdBy?.firstName}{" "}
                  {classData.createdBy?.lastName}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Joined On
                </Typography>
                <Typography variant="body1">
                  {new Date(
                    classData.enrollments?.[0]?.createdAt || classData.createdAt
                  ).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label="Enrolled"
                  color="success"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom>
                Classmates
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {classData.enrollments && classData.enrollments.length > 0 ? (
                <List
                  dense
                  disablePadding>
                  {classData.enrollments.map((enrollment) => (
                    <ListItem
                      key={enrollment.id}
                      disablePadding
                      sx={{ mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${enrollment.user.firstName} ${enrollment.user.lastName}`}
                        secondary={enrollment.user.profile?.rollNumber || ""}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary">
                    No other students enrolled yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Updated Calendar Card */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <Typography variant="h6">Test Calendar</Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => setCalendarOpen(true)}>
                  View Calendar
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom>
                  Upcoming Events & Tests (Next 3 Days)
                </Typography>
                {/* Use the filtered combined list */}
                {combinedCalendarEvents.length > 0 ? (
                  <List
                    dense
                    disablePadding>
                    {/* Show only first 3 events from the filtered list */}
                    {combinedCalendarEvents.slice(0, 3).map((event) => {
                      const eventStatus = getEventStatus(event);
                      return (
                        <ListItem
                          key={event.id}
                          disablePadding
                          sx={{ mb: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <EventIcon
                              fontSize="small"
                              color={event.type === "test" ? "info" : "warning"}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={event.title}
                            secondary={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary">
                                  {new Date(
                                    event.startTime
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(event.startTime).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </Typography>
                                {eventStatus && (
                                  <Chip
                                    icon={eventStatus.icon}
                                    label={eventStatus.text}
                                    size="small"
                                    color={eventStatus.color}
                                    sx={{
                                      height: "18px",
                                      fontSize: "0.65rem",
                                      ml: 1,
                                    }}
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}

                    {combinedCalendarEvents.length > 3 && (
                      <Button
                        size="small"
                        onClick={() => setCalendarOpen(true)}
                        sx={{ mt: 1, ml: 4.5 }}>
                        See {combinedCalendarEvents.length - 3} more
                      </Button>
                    )}
                  </List>
                ) : (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary">
                      No upcoming events or relevant tests
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Updated Calendar Dialog */}
      <Dialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <Typography variant="h6">Test Calendar</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton onClick={handlePrevMonth}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography
                variant="subtitle1"
                sx={{ mx: 2 }}>
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <IconButton onClick={handleNextMonth}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer
            component={Paper}
            elevation={0}>
            <Table>
              <TableHead>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <TableCell
                      key={day}
                      align="center">
                      <Typography variant="subtitle2">{day}</Typography>
                    </TableCell>
                  )
                )}
              </TableHead>
              <TableBody>{renderCalendarDays()}</TableBody>
            </Table>
          </TableContainer>

          {/* Updated upcoming events/tests list */}
          {getEventsForCurrentMonthView().length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="subtitle1"
                gutterBottom>
                Events & Tests This Month
              </Typography>
              <List dense>
                {getEventsForCurrentMonthView().map((event) => {
                  const eventStatus = getEventStatus(event);
                  return (
                    <ListItem
                      key={event.id}
                      sx={{
                        mb: 1,
                        bgcolor:
                          event.type === "test"
                            ? "rgba(25, 118, 210, 0.05)"
                            : "rgba(237, 108, 2, 0.05)",
                        borderRadius: 1,
                        borderLeft: `4px solid ${
                          event.type === "test" ? "info.main" : "warning.main"
                        }`,
                        pl: 1.5,
                      }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <EventIcon
                          color={event.type === "test" ? "info" : "warning"}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {new Date(event.startTime).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(event.startTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                              {event.endTime &&
                                ` - ${new Date(
                                  event.endTime
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                            </Typography>
                            {eventStatus && (
                              <Chip
                                icon={eventStatus.icon}
                                label={eventStatus.text}
                                size="small"
                                color={eventStatus.color}
                                sx={{
                                  height: "20px",
                                  fontSize: "0.7rem",
                                  mt: 0.5,
                                }}
                              />
                            )}
                            {event.type === "test" && event.duration && (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}>
                                Duration: {event.duration} minutes
                              </Typography>
                            )}
                            {event.type === "event" && event.description && (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}>
                                {event.description}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassDetail;

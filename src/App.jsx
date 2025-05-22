import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header/Header";
import Hero from "./components/Hero-section/Hero";
import Footer from "./components/Footer/Footer";
import StudentDashboard from "./components/dashboard/dashboard";
import AdminDashboard from "./components/admin-dashboard/admindashboard";
import Profile from "./components/profile/Profile";
import StudentTest from "./components/student-test/StudentTest";
import LoginForm from "./components/login-form/Login";
import SignUp from "./components/signup-form/Signup";
import TestCreator from "./components/create-test/createTest";

// Class Management Components
import ClassManagement from "./components/admin/ClassManagement";
import AdminClassDetail from "./components/admin/ClassDetail";
import EnrollmentManagement from "./components/admin/EnrollmentManagement";
import TestAssignments from "./components/admin/TestAssignments";
import JoinClass from "./components/student/JoinClass";
import StudentClassDetail from "./components/student/ClassDetail";

// Protected route component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <Header />
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={<Hero />}
        />
        <Route
          path="/login"
          element={<LoginForm />}
        />
        <Route
          path="/signup"
          element={<SignUp />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {isAdmin ? <AdminDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-test"
          element={
            <ProtectedRoute requireAdmin={true}>
              <TestCreator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/tests/:id"
          element={
            <ProtectedRoute>
              <StudentTest />
            </ProtectedRoute>
          }
        />

        {/* Admin Class Management Routes */}
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ClassManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes/:id"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminClassDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes/:id/enrollments"
          element={
            <ProtectedRoute requireAdmin={true}>
              <EnrollmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes/:id/tests"
          element={
            <ProtectedRoute requireAdmin={true}>
              <TestAssignments />
            </ProtectedRoute>
          }
        />

        {/* Student Class Routes */}
        <Route
          path="/student/classes"
          element={
            <ProtectedRoute>
              <JoinClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes/:id"
          element={
            <ProtectedRoute>
              <StudentClassDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;

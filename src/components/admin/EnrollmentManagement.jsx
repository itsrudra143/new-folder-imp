import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useClass, 
  usePendingEnrollments, 
  useUpdateEnrollmentStatus 
} from '../../hooks/useClasses';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Divider, 
  IconButton, 
  Paper, 
  Tab, 
  Tabs, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-hot-toast';

const EnrollmentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: classData, isLoading: isClassLoading } = useClass(id);
  const { data: pendingEnrollments, isLoading: isPendingLoading } = usePendingEnrollments(id);
  const { mutate: updateEnrollmentStatus, isPending: isUpdating } = useUpdateEnrollmentStatus();
  
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleApprove = (enrollmentId) => {
    updateEnrollmentStatus({
      enrollmentId,
      status: 'APPROVED'
    }, {
      onSuccess: () => {
        toast.success('Student enrollment approved');
      }
    });
  };
  
  const handleReject = (enrollmentId) => {
    updateEnrollmentStatus({
      enrollmentId,
      status: 'REJECTED'
    }, {
      onSuccess: () => {
        toast.success('Student enrollment rejected');
      }
    });
  };
  
  if (isClassLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!classData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">Class not found</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/classes')}
          sx={{ mt: 2 }}
        >
          Back to Classes
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/admin/classes/${id}`)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Manage Enrollments: {classData.name}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Enrolled Students" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Pending Requests</span>
                {pendingEnrollments && pendingEnrollments.length > 0 && (
                  <Chip 
                    label={pendingEnrollments.length} 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Box>
            } 
          />
        </Tabs>
      </Box>
      
      {tabValue === 0 ? (
        // Enrolled Students Tab
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roll Number</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Joined On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classData.enrollments && classData.enrollments.length > 0 ? (
                classData.enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1 }}>
                          {enrollment.user.firstName.charAt(0)}
                        </Avatar>
                        <Typography>
                          {enrollment.user.firstName} {enrollment.user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{enrollment.user.email}</TableCell>
                    <TableCell>{enrollment.user.profile?.rollNumber || 'N/A'}</TableCell>
                    <TableCell>{enrollment.user.profile?.class || 'N/A'}</TableCell>
                    <TableCell>{enrollment.user.profile?.batch || 'N/A'}</TableCell>
                    <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3 }}>
                      <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        No students enrolled yet
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Pending Requests Tab
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roll Number</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Requested On</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPendingLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={30} sx={{ my: 3 }} />
                  </TableCell>
                </TableRow>
              ) : pendingEnrollments && pendingEnrollments.length > 0 ? (
                pendingEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1 }}>
                          {enrollment.user.firstName.charAt(0)}
                        </Avatar>
                        <Typography>
                          {enrollment.user.firstName} {enrollment.user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{enrollment.user.email}</TableCell>
                    <TableCell>{enrollment.user.profile?.rollNumber || 'N/A'}</TableCell>
                    <TableCell>{enrollment.user.profile?.class || 'N/A'}</TableCell>
                    <TableCell>{enrollment.user.profile?.batch || 'N/A'}</TableCell>
                    <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Approve">
                          <IconButton 
                            color="success" 
                            onClick={() => handleApprove(enrollment.id)}
                            disabled={isUpdating}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton 
                            color="error" 
                            onClick={() => handleReject(enrollment.id)}
                            disabled={isUpdating}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 3 }}>
                      <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        No pending enrollment requests
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Class Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Class Code
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {classData.code}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Share this code with students to allow them to join the class.
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/admin/classes/${id}`)}
              >
                Back to Class Details
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EnrollmentManagement; 
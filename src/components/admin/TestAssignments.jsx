import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useClass, 
  useClassTests, 
  useAssignTestToClass, 
  useRemoveTestFromClass 
} from '../../hooks/useClasses';
import { useTests } from '../../hooks/useTests';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider, 
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton, 
  MenuItem,
  Paper, 
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { toast } from 'react-hot-toast';

const TestAssignments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: classData, isLoading: isClassLoading } = useClass(id);
  const { data: classTests, isLoading: isClassTestsLoading } = useClassTests(id);
  const { data: allTests, isLoading: isAllTestsLoading } = useTests();
  const { mutate: assignTest, isPending: isAssigning } = useAssignTestToClass();
  const { mutate: removeTest, isPending: isRemoving } = useRemoveTestFromClass();
  
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState('');
  const [availableTests, setAvailableTests] = useState([]);
  
  // Filter out tests that are already assigned to the class
  useEffect(() => {
    if (allTests && classTests) {
      const assignedTestIds = classTests.map(test => test.id);
      const filtered = allTests.filter(test => !assignedTestIds.includes(test.id));
      setAvailableTests(filtered);
    }
  }, [allTests, classTests]);
  
  const handleAssignTest = () => {
    if (!selectedTest) {
      toast.error('Please select a test to assign');
      return;
    }
    
    assignTest({
      classId: id,
      testId: selectedTest
    }, {
      onSuccess: () => {
        setOpenAssignDialog(false);
        setSelectedTest('');
        toast.success('Test assigned to class successfully');
      }
    });
  };
  
  const handleRemoveTest = (assignmentId) => {
    removeTest(assignmentId, {
      onSuccess: () => {
        toast.success('Test removed from class successfully');
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
          Manage Tests: {classData.name}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenAssignDialog(true)}
          disabled={isAllTestsLoading || (availableTests && availableTests.length === 0)}
        >
          Assign Test
        </Button>
      </Box>
      
      {isClassTestsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Questions</TableCell>
                <TableCell>Duration (min)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classTests && classTests.length > 0 ? (
                classTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.title}</TableCell>
                    <TableCell>{test.description || 'No description'}</TableCell>
                    <TableCell>{test._count?.questions || 0}</TableCell>
                    <TableCell>{test.duration}</TableCell>
                    <TableCell>
                        {test.isActive ? (
                          <Tooltip title="Test is active and available to students">
                            <Box component="span" sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              color: 'success.main',
                              fontWeight: 'bold'
                            }}>
                              Active
                            </Box>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Test is not active">
                            <Box component="span" sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              color: 'warning.main',
                              fontWeight: 'bold'
                            }}>
                              Inactive
                            </Box>
                          </Tooltip>
                        )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="View Test">
                          <IconButton 
                            color="primary" 
                            onClick={() => navigate(`/admin/tests/${test.id}`)}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove from Class">
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveTest(test.testClassId)}
                            disabled={isRemoving}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3 }}>
                      <AssignmentIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        No tests assigned to this class yet
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenAssignDialog(true)}
                        sx={{ mt: 2 }}
                        disabled={isAllTestsLoading || (availableTests && availableTests.length === 0)}
                      >
                        Assign Test
                      </Button>
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
                Class Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {classData.name}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Enrolled Students
              </Typography>
              <Typography variant="body1">
                {classData.enrollments?.length || 0}
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
      
      {/* Assign Test Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>Assign Test to Class</DialogTitle>
        <DialogContent>
          {isAllTestsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : availableTests && availableTests.length > 0 ? (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <Select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select a test to assign
                </MenuItem>
                {availableTests.map((test) => (
                  <MenuItem key={test.id} value={test.id}>
                    {test.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography color="text.secondary">
              All available tests have already been assigned to this class.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignTest} 
            variant="contained" 
            color="primary"
            disabled={!selectedTest || isAssigning || availableTests.length === 0}
          >
            {isAssigning ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestAssignments; 
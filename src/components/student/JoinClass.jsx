import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJoinClass, useClasses } from '../../hooks/useClasses';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Divider, 
  Grid, 
  Paper, 
  TextField, 
  Typography,
  Chip
} from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import { toast } from 'react-hot-toast';

const JoinClass = () => {
  const navigate = useNavigate();
  const { data: classes, isLoading } = useClasses({
    refetchInterval: 60000 // Refetch every minute to check for test activation
  });
  const { mutate: joinClass, isPending: isJoining } = useJoinClass();
  
  const [classCode, setClassCode] = useState('');
  
  const handleJoinClass = () => {
    if (!classCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }
    
    joinClass(classCode.trim(), {
      onSuccess: () => {
        setClassCode('');
      }
    });
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Classes
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : classes && classes.length > 0 ? (
            <Grid container spacing={2}>
              {classes.map((classItem) => (
                <Grid item xs={12} sm={6} key={classItem.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 3
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/student/classes/${classItem.id}`)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" component="h2" gutterBottom>
                        {classItem.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {classItem.description || 'No description provided'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Teacher:</strong> {classItem.createdBy.firstName} {classItem.createdBy.lastName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <SchoolIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {classItem._count?.tests || 0} Tests
                          </Typography>
                        </Box>
                        {classItem.upcomingTests > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip 
                              label={`${classItem.upcomingTests} Upcoming`} 
                              color="info" 
                              size="small" 
                              sx={{ fontWeight: 'bold' }} 
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <ClassIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                You haven't joined any classes yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Join a class to access tests and assignments
              </Typography>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Join a Class
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                Enter the class code provided by your teacher to join a class.
              </Typography>
              
              <TextField
                fullWidth
                label="Class Code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Enter 6-digit code"
                margin="normal"
                variant="outlined"
              />
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={handleJoinClass}
                disabled={!classCode.trim() || isJoining}
                sx={{ mt: 2 }}
              >
                {isJoining ? <CircularProgress size={24} /> : 'Join Class'}
              </Button>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Class Status Guide
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Approved" color="success" size="small" />
                  <Typography variant="body2">
                    You are enrolled in the class
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Pending" color="warning" size="small" />
                  <Typography variant="body2">
                    Your enrollment request is awaiting approval
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Rejected" color="error" size="small" />
                  <Typography variant="body2">
                    Your enrollment request was rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JoinClass; 
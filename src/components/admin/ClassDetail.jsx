import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useClass, 
  useUpdateClass, 
  useRegenerateClassCode 
} from '../../hooks/useClasses';
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
  TextField, 
  Tooltip, 
  Typography 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-hot-toast';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: classData, isLoading } = useClass(id);
  const { mutate: updateClass, isPending: isUpdating } = useUpdateClass();
  const { mutate: regenerateCode, isPending: isRegenerating } = useRegenerateClassCode();
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        description: classData.description || ''
      });
    }
  }, [classData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUpdateClass = () => {
    updateClass({
      id,
      classData: formData
    });
  };
  
  const handleRegenerateCode = () => {
    regenerateCode(id);
  };
  
  const copyClassCode = () => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code);
      toast.success('Class code copied to clipboard');
    }
  };
  
  if (isLoading) {
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
        <IconButton onClick={() => navigate('/admin/classes')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Class Details
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <TextField
              fullWidth
              label="Class Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleUpdateClass}
                disabled={isUpdating || !formData.name}
              >
                {isUpdating ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Class Code
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                label="Share this code with students"
                value={classData.code}
                InputProps={{
                  readOnly: true,
                }}
                margin="normal"
              />
              <Tooltip title="Copy code">
                <IconButton onClick={copyClassCode} sx={{ ml: 1 }}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Generate new code">
                <IconButton 
                  onClick={handleRegenerateCode} 
                  disabled={isRegenerating}
                  sx={{ ml: 1 }}
                >
                  {isRegenerating ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Note: Regenerating the code will invalidate the previous code. Students who haven't joined yet will need the new code.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Class Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created On
                </Typography>
                <Typography variant="body1">
                  {new Date(classData.createdAt).toLocaleDateString()}
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
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Assigned Tests
                </Typography>
                <Typography variant="body1">
                  {classData.tests?.length || 0}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/admin/classes/${id}/enrollments`)}
                  fullWidth
                >
                  Manage Enrollments
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/admin/classes/${id}/tests`)}
                  fullWidth
                >
                  Manage Tests
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClassDetail;

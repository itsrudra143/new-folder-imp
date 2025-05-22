import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useClasses, 
  useCreateClass, 
  useDeleteClass 
} from '../../hooks/useClasses';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid, 
  IconButton, 
  TextField, 
  Typography,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';

const ClassManagement = () => {
  const navigate = useNavigate();
  const { data: classes, isLoading } = useClasses();
  const { mutate: createClass, isPending: isCreating } = useCreateClass();
  const { mutate: deleteClass, isPending: isDeleting } = useDeleteClass();
  
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClass = () => {
    createClass(formData, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setFormData({ name: '', description: '' });
      }
    });
  };

  const handleDeleteClass = () => {
    if (selectedClass) {
      deleteClass(selectedClass.id, {
        onSuccess: () => {
          setOpenDeleteDialog(false);
          setSelectedClass(null);
        }
      });
    }
  };

  const confirmDelete = (classItem) => {
    setSelectedClass(classItem);
    setOpenDeleteDialog(true);
  };

  const navigateToClassDetail = (classId) => {
    navigate(`/admin/classes/${classId}`);
  };

  const navigateToEnrollments = (classId) => {
    navigate(`/admin/classes/${classId}/enrollments`);
  };

  const navigateToTestAssignments = (classId) => {
    navigate(`/admin/classes/${classId}/tests`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Class Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Create Class
        </Button>
      </Box>

      <Grid container spacing={3}>
        {classes && classes.length > 0 ? (
          classes.map((classItem) => (
            <Grid item xs={12} sm={6} md={4} key={classItem.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
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
                      <strong>Class Code:</strong> {classItem.code}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {classItem._count?.enrollments || 0} Students
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AssignmentIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {classItem._count?.tests || 0} Tests
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => navigateToClassDetail(classItem.id)}
                    title="Edit Class"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => navigateToEnrollments(classItem.id)}
                    title="Manage Enrollments"
                  >
                    <PeopleIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => navigateToTestAssignments(classItem.id)}
                    title="Manage Tests"
                  >
                    <SchoolIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => confirmDelete(classItem)}
                    title="Delete Class"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                You haven't created any classes yet
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Class
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create Class Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Class</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Class Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateClass} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || isCreating}
          >
            {isCreating ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the class "{selectedClass?.name}"? 
            This will remove all enrollments and test assignments for this class. 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteClass} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassManagement; 
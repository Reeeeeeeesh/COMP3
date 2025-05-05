/**
 * UploadPanel Component
 * 
 * Handles CSV file upload using react-dropzone and PapaParse
 */

import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  styled
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useScenario, ActionType } from '../../SimpleContext';
import { uploadCsvFile } from '../../api/compensationService';

// Styled components
const DropzoneContainer = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.background.default,
  transition: 'border .3s ease-in-out',
  marginBottom: theme.spacing(2),
  '&:hover': {
    borderColor: theme.palette.secondary.main,
  }
}));

/**
 * UploadPanel component
 * Allows users to upload CSV files with employee data
 */
const UploadPanel: React.FC = () => {
  const { state, dispatch } = useScenario();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * Process CSV file and update state with employee data
   */
  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      // Option 1: Parse locally with PapaParse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`);
            setLoading(false);
            return;
          }
          
          try {
            console.log("CSV parsing complete. Raw data:", results.data);
            
            // Convert CSV data to Employee objects
            const employees = results.data.map((row: any, index: number) => ({
              id: row.id || `emp-${index}`,
              name: row.name || '',
              department: row.department || '',
              role: row.role || '',
              base_salary: parseFloat(row.base_salary) || 0,
              performance_rating: parseInt(row.performance_rating) || 3,
              quintile: row.quintile || 'Q3',
              aum: parseFloat(row.aum) || 0,
              is_mrt: row.is_mrt === 'true' || row.is_mrt === true,
            }));
            
            console.log("Processed employee data:", employees);
            console.log("Current state before dispatch:", state);
            
            // Update state with employee data
            dispatch({
              type: ActionType.SET_EMPLOYEES,
              payload: employees,
            });
            
            console.log(`Successfully processed ${employees.length} employees`);
            setSuccess(`Successfully uploaded ${employees.length} employees`);
            setSelectedFile(null); // Reset selected file after successful upload
          } catch (err) {
            console.error("Error processing CSV data:", err);
            setError(`Error processing CSV data: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          
          setLoading(false);
        },
        error: (error: Papa.ParseError) => {
          console.error("CSV parsing error:", error);
          setError(`CSV parsing error: ${error.message}`);
          setLoading(false);
        }
      });
      
      // Option 2: Upload to backend API (alternative approach)
      // try {
      //   const response = await uploadCsvFile(file);
      //   dispatch({
      //     type: ActionType.SET_EMPLOYEES,
      //     payload: response.employees,
      //   });
      //   setSuccess(`Successfully uploaded ${response.employees.length} employees`);
      // } catch (err) {
      //   setError(`API error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // }
      // setLoading(false);
      
    } catch (err) {
      console.error("File processing error:", err);
      setError(`File processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [dispatch, state]);
  
  /**
   * Handle file drop
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setSelectedFile(file);
  }, []);
  
  /**
   * Set up dropzone
   */
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });
  
  /**
   * Handle error close
   */
  const handleCloseError = () => {
    setError(null);
  };
  
  /**
   * Handle success close
   */
  const handleCloseSuccess = () => {
    setSuccess(null);
  };

  /**
   * Handle browse button click
   */
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setSelectedFile(file);
    }
  };

  /**
   * Handle upload button click
   */
  const handleUploadClick = () => {
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  /**
   * Handle cancel button click
   */
  const handleCancelClick = () => {
    setSelectedFile(null);
  };
  
  return (
    <Box>
      {!selectedFile ? (
        <>
          <DropzoneContainer
            {...getRootProps()}
            sx={{
              borderColor: isDragActive
                ? 'secondary.main'
                : isDragReject
                ? 'error.main'
                : 'primary.main',
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ mb: 1 }} />
                <Typography>Processing file...</Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Upload Employee Data
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Drag & drop a CSV file or click to browse
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                  CSV should include: id, name, department, role, base_salary, performance_rating, quintile, aum, is_mrt
                </Typography>
              </>
            )}
          </DropzoneContainer>
          
          {/* Separate file input for the Browse button */}
          <input
            ref={fileInputRef}
            type="file"
            id="csv-file-input"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
          
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleBrowseClick}
            disabled={loading}
          >
            Browse Files
          </Button>
        </>
      ) : (
        <Box sx={{ mb: 2 }}>
          <Paper sx={{ p: 3, border: '1px solid', borderColor: 'primary.main', borderRadius: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <UploadFileIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleCancelClick}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleUploadClick}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* Success Snackbar */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UploadPanel;

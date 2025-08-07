import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Clock, Building2, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ParseResult } from '../types';
import { apiCall } from '../utils/api';
import toast from 'react-hot-toast';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  parseResult?: ParseResult;
}

export const PdfUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check file size (10MB limit)
    const oversizedFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Max size is 10MB.`);
      acceptedFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading each file
    newFiles.forEach((fileObj, index) => {
      uploadFile(fileObj.file, uploadedFiles.length + index);
    });
  }, [uploadedFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const uploadFile = async (file: File, index: number) => {
    setUploadedFiles(prev => 
      prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading' } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map((f, i) => 
            i === index && f.progress < 90 
              ? { ...f, progress: f.progress + 10 } 
              : f
          )
        );
      }, 200);

      const result = await apiCall<ParseResult>('POST', '/statements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      
      setUploadedFiles(prev => 
        prev.map((f, i) => 
          i === index 
            ? { ...f, status: 'success', progress: 100, parseResult: result } 
            : f
        )
      );

      if (result.warnings && result.warnings.length > 0) {
        toast.success(`${file.name} uploaded with warnings`);
      } else {
        toast.success(`${file.name} uploaded successfully!`);
      }
    } catch (error: any) {
      setUploadedFiles(prev => 
        prev.map((f, i) => 
          i === index 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error.message || 'Upload failed'
              } 
            : f
        )
      );
      
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const retryUpload = (index: number) => {
    const fileObj = uploadedFiles[index];
    if (fileObj) {
      uploadFile(fileObj.file, index);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Bank Statement</h1>
        <p className="text-gray-600">
          We support most Indian banks. Upload PDF statements to automatically extract and categorize transactions using AI.
        </p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragActive ? 'Drop your files here' : 'Upload your bank statements'}
          </h3>
          <p className="text-gray-500 mb-4">
            Drag and drop your PDF files here, or click to browse
          </p>
          <div className="text-sm text-gray-400">
            <p>We support most Indian banks • PDF files only • Max 10MB per file</p>
            <p>Multiple files can be uploaded at once</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h3>
          <div className="space-y-3">
            {uploadedFiles.map((fileObj, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileObj.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {fileObj.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{fileObj.progress}%</span>
                      </div>
                    </div>
                  )}
                  
                  {fileObj.error && (
                    <p className="text-xs text-danger-600 mt-1">{fileObj.error}</p>
                  )}
                </div>
                    {fileObj.parseResult && fileObj.status === 'success' && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-success-600" />
                            <span>{fileObj.parseResult.transactionCount} transactions extracted</span>
                          </span>
                          {fileObj.parseResult.bankName && (
                            <span className="flex items-center space-x-1">
                              <Building2 className="w-3 h-3" />
                              <span>{fileObj.parseResult.bankName}</span>
                            </span>
                          )}
                        </div>
                        {fileObj.parseResult.warnings && fileObj.parseResult.warnings.length > 0 && (
                          <div className="flex items-start space-x-1 text-xs text-yellow-600">
                            <AlertTriangle className="w-3 h-3 mt-0.5" />
                            <div>
                              <p className="font-medium">Parse warnings:</p>
                              <ul className="list-disc list-inside">
                                {fileObj.parseResult.warnings.map((warning, i) => (
                                  <li key={i}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                <div className="flex items-center space-x-2">
                  {fileObj.status === 'uploading' && (
                    <LoadingSpinner size="sm" />
                  )}
                  
                  {fileObj.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  )}
                  
                  {fileObj.status === 'error' && (
                    <>
                      <button
                        onClick={() => retryUpload(index)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Retry
                      </button>
                      <AlertCircle className="w-5 h-5 text-danger-600" />
                    </>
                  )}
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900 mt-0.5">1</span>
            <p>Upload your PDF bank statements using the area above</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900 mt-0.5">2</span>
            <p>Our AI will extract transaction data using OCR and GPT-4</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900 mt-0.5">3</span>
            <p>Transactions are automatically categorized and added to your dashboard</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900 mt-0.5">4</span>
            <p>View insights and analytics on your spending patterns</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Supported banks:</strong> Most major Indian banks including SBI, HDFC, ICICI, Axis, Kotak, and more.
            If your bank format isn't recognized, we\'ll show parsing warnings.
          </p>
        </div>
      </div>
    </div>
  );
};
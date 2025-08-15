import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Clock, Building2, AlertTriangle, Crown } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ParseResult, UsageStats } from '../types';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
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
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const { user } = useAuth();
  const [globalPdfPassword, setGlobalPdfPassword] = useState(''); // optional password applied to all initial uploads
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordModalValue, setPasswordModalValue] = useState('');
  const [passwordRetryIndex, setPasswordRetryIndex] = useState<number | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  React.useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const data = await apiCall<UsageStats>('GET', '/user/usage');
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Block upload if subscription is expired
    if (usage && usage.status === 'EXPIRED') {
      toast.error('Your subscription has expired. Please upgrade your plan to continue uploading.');
      return;
    }
    // Check if user can upload
    if (usage && !usage.canUpload) {
      toast.error('You have reached your monthly upload limit. Please upgrade your plan to continue.');
      return;
    }

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
    
    // Start uploading each file sequentially so we can pause if a password is needed
    (async () => {
      for (let i = 0; i < newFiles.length; i++) {
        const globalIndex = uploadedFiles.length + i;
        await uploadFile(newFiles[i].file, globalIndex);
        // If a password prompt opened, pause remaining until resolved
        if (passwordRetryIndex !== null) break;
      }
    })();
  }, [uploadedFiles.length, usage]);

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

    let progressInterval: any;
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (globalPdfPassword.trim()) {
        formData.append('pdfPassword', globalPdfPassword.trim());
      }

      // Simulate progress for better UX
      progressInterval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map((f, i) => 
            i === index && f.progress < 90 
              ? { ...f, progress: f.progress + 10 } 
              : f
          )
        );
      }, 200);

      const result = await apiCall<any>('POST', '/statements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (progressInterval) clearInterval(progressInterval);
      if (result?.passwordRequired) {
        setPasswordRetryIndex(index);
        setPasswordModalValue('');
        setPasswordModalOpen(true);
        // Mark as error awaiting password instead of success
        setUploadedFiles(prev => prev.map((f,i)=> i===index ? { ...f, status:'error', progress:0, error:'Password required' } : f));
        return;
      }
      
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
      if (progressInterval) clearInterval(progressInterval);
      if (error?.response?.data?.passwordRequired) {
        setPasswordRetryIndex(index);
        setPasswordModalValue('');
        setPasswordModalOpen(true);
        return; // pause normal error flow until user acts
      }
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
    
    // Refresh usage after upload
    fetchUsage();
  };

  const uploadFileWithPassword = async (file: File, index: number, password: string) => {
    setUploadedFiles(prev => prev.map((f,i)=> i===index ? { ...f, status:'uploading', progress:0 } : f));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pdfPassword', password);
    try {
      const result = await apiCall<any>('POST', '/statements', formData, { headers: { 'Content-Type':'multipart/form-data' } });
      setUploadedFiles(prev => prev.map((f,i)=> i===index ? { ...f, status:'success', progress:100, parseResult: result } : f));
      toast.success(`${file.name} uploaded successfully!`);
      fetchUsage();
    } catch (err:any){
      setUploadedFiles(prev => prev.map((f,i)=> i===index ? { ...f, status:'error', error: err.message || 'Upload failed' } : f));
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

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'PRO': return 'Pro';
      case 'PREMIUM': return 'Premium';
      default: return 'Free';
    }
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'text-danger-600';
    if (percentage >= 80) return 'text-warning-600';
    return 'text-primary-600';
  };

  return (
  <div className="space-y-6 animate-fade-in relative">
      {usage && usage.status === 'EXPIRED' && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <div className="font-semibold text-yellow-900">Your subscription has expired</div>
            <div className="text-yellow-800 text-sm">Upgrade to Pro or Premium to restore upload access.</div>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Bank Statement</h1>
        <p className="text-gray-600">
          We support most Indian banks. Upload PDF statements to automatically extract and categorize transactions using AI.
        </p>
      </div>

      {/* Usage Stats */}
      {!loadingUsage && usage && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {usage.planType === 'PREMIUM' ? (
                  <Crown className="w-4 h-4 text-blue-600" />
                ) : (
                  <Upload className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{getPlanName(usage.planType)} Plan Usage</h3>
                <p className="text-sm text-gray-600">Your current month's activity</p>
              </div>
            </div>
            {usage.planType === 'FREE' && (
              <button
                onClick={() => window.location.href = '/billing'}
                className="btn-primary text-sm"
              >
                Upgrade Plan
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Statements</span>
                <span className={`text-sm font-bold ${getUsageColor(usage.statementsThisMonth, usage.statementLimit)}`}>
                  {usage.statementsThisMonth} / {usage.statementLimit === -1 ? '∞' : usage.statementLimit}
                </span>
              </div>
              {usage.statementLimit !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usage.statementsThisMonth >= usage.statementLimit ? 'bg-danger-600' :
                      usage.statementsThisMonth / usage.statementLimit >= 0.8 ? 'bg-warning-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min((usage.statementsThisMonth / usage.statementLimit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Pages</span>
                <span className={`text-sm font-bold ${getUsageColor(usage.pagesThisMonth, usage.statementLimit * usage.pageLimit)}`}>
                  {usage.pagesThisMonth} / {usage.pageLimit === -1 ? '∞' : usage.statementLimit * usage.pageLimit}
                </span>
              </div>
              {usage.pageLimit !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usage.pagesThisMonth >= (usage.statementLimit * usage.pageLimit) ? 'bg-danger-600' :
                      usage.pagesThisMonth / (usage.statementLimit * usage.pageLimit) >= 0.8 ? 'bg-warning-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min((usage.pagesThisMonth / (usage.statementLimit * usage.pageLimit)) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          
          {!usage.canUpload && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Upload limit reached</p>
                  <p className="text-xs text-yellow-700">
                    You've reached your monthly limit. Upgrade to continue uploading statements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div className="card">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">PDF Password (optional)</label>
            <input
              type="password"
              placeholder="Enter password if statement is protected"
              value={globalPdfPassword}
              onChange={e => setGlobalPdfPassword(e.target.value)}
              className="input-field !py-2 !px-3 w-72"
              autoComplete="off"
            />
          </div>
          {globalPdfPassword && (
            <button
              type="button"
              onClick={() => setGlobalPdfPassword('')}
              className="text-xs text-gray-500 hover:text-gray-700 self-center"
            >
              Clear password
            </button>
          )}
        </div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            usage && !usage.canUpload
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              : isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} disabled={!!(usage && !usage.canUpload)} />
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {usage && !usage.canUpload 
              ? 'Upload limit reached' 
              : isDragActive 
              ? 'Drop your files here' 
              : 'Upload your bank statements'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {usage && !usage.canUpload
              ? 'Upgrade your plan to continue uploading statements'
              : 'Drag and drop your PDF files here, or click to browse'
            }
          </p>
          <div className="text-sm text-gray-400">
            {usage && !usage.canUpload ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '/billing';
                }}
                className="btn-primary"
              >
                Upgrade Plan
              </button>
            ) : (
              <>
                <p>We support most Indian banks • PDF files only • Max 10MB per file</p>
                <p>Multiple files can be uploaded at once</p>
              </>
            )}
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

      {/* Password Retry Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-funky p-6 w-full max-w-sm space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Password Required</h3>
              <p className="text-sm text-gray-600 mt-1">This PDF is protected. Enter the password to retry extraction.</p>
            </div>
            <div>
              <label className="text-xs uppercase font-semibold tracking-wide text-gray-500 mb-1 block">Password</label>
              <input
                type="password"
                autoFocus
                className="input-field !py-2 !px-3"
                value={passwordModalValue}
                onChange={e => setPasswordModalValue(e.target.value)}
                placeholder="Enter PDF password"
                disabled={passwordSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary !py-2 !px-4 text-sm"
                disabled={passwordSubmitting}
                onClick={() => { if (!passwordSubmitting) { setPasswordModalOpen(false); setPasswordRetryIndex(null); } }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
                disabled={!passwordModalValue || passwordSubmitting}
                onClick={async () => {
                  if (passwordRetryIndex == null) return;
                  setPasswordSubmitting(true);
                  try {
                    await uploadFileWithPassword(uploadedFiles[passwordRetryIndex].file, passwordRetryIndex, passwordModalValue);
                    setPasswordModalOpen(false);
                    setPasswordRetryIndex(null);
                    setPasswordModalValue('');
                  } finally {
                    setPasswordSubmitting(false);
                  }
                }}
              >
                {passwordSubmitting ? 'Submitting...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
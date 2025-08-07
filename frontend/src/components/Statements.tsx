import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  RefreshCw, 
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { EmptyState } from './ui/EmptyState';
import { RawStatement } from '../types';
import { apiCall } from '../utils/api';
import { formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';

export const Statements: React.FC = () => {
  const [statements, setStatements] = useState<RawStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const data = await apiCall<RawStatement[]>('GET', '/statements');
      setStatements(data);
    } catch (error: any) {
      toast.error('Failed to load statements');
      console.error('Statements error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this statement? This will also remove all associated transactions.')) {
      return;
    }

    try {
      await apiCall('DELETE', `/statements/${id}`);
      setStatements(prev => prev.filter(s => s.id !== id));
      toast.success('Statement deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete statement');
    }
  };

  const handleReparse = async (id: number) => {
    try {
      setProcessingIds(prev => new Set(prev).add(id));
      await apiCall('POST', `/statements/${id}/reparse`);
      toast.success('Statement is being re-parsed');
      // Refresh the list after a delay
      setTimeout(fetchStatements, 2000);
    } catch (error: any) {
      toast.error('Failed to re-parse statement');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-danger-600" />;
      case 'PROCESSING':
        return <LoadingSpinner size="sm" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'PROCESSING':
        return 'Processing';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No statements uploaded"
        description="Upload your first bank statement to see it listed here"
        action={{
          label: 'Upload Statement',
          onClick: () => window.location.href = '/upload'
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Uploaded Statements</h1>
          <p className="text-gray-600 mt-1">
            Manage your uploaded bank statements and re-process if needed
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/upload'}
          className="btn-primary"
        >
          Upload New Statement
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statements.map((statement) => (
                <tr key={statement.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {statement.fileName}
                        </div>
                        {statement.parseWarnings && statement.parseWarnings.length > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">
                            {statement.parseWarnings.length} warning(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{statement.bankName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDateTime(statement.uploadDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(statement.status)}
                      <span className={`text-sm font-medium ${
                        statement.status === 'COMPLETED' ? 'text-success-600' :
                        statement.status === 'FAILED' ? 'text-danger-600' :
                        'text-gray-600'
                      }`}>
                        {getStatusText(statement.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {statement.transactionCount || 0} transactions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleReparse(statement.id)}
                        disabled={processingIds.has(statement.id)}
                        className="text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Re-parse statement"
                      >
                        {processingIds.has(statement.id) ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(statement.id)}
                        className="text-danger-600 hover:text-danger-700"
                        title="Delete statement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Statement Management</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Re-parse:</strong> Use this if we've improved our parsing algorithms and you want to re-process an old statement.</p>
          <p><strong>Delete:</strong> Permanently removes the statement and all associated transactions from your account.</p>
          <p><strong>Warnings:</strong> Indicate potential issues during parsing - the data may still be accurate but should be reviewed.</p>
        </div>
      </div>
    </div>
  );
};
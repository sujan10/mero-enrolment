"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Download,
  Filter,
  Search,
  Eye
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  user: string;
  action: string;
  details: string;
  ip?: string;
}

const SystemLogs: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock log data - in real app, this would come from API
  const logs: LogEntry[] = [
    {
      id: '1',
      timestamp: '2024-06-01 15:30:22',
      level: 'success',
      user: 'admin@company.com',
      action: 'Form published',
      details: 'Form "Employee Registration" was published successfully',
      ip: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: '2024-06-01 15:28:15',
      level: 'info',
      user: 'john.doe@email.com',
      action: 'User registered',
      details: 'New client user registered',
      ip: '203.0.113.45'
    },
    {
      id: '3',
      timestamp: '2024-06-01 15:25:33',
      level: 'warning',
      user: 'admin@company.com',
      action: 'Failed login attempt',
      details: 'Multiple failed login attempts detected',
      ip: '192.168.1.100'
    },
    {
      id: '4',
      timestamp: '2024-06-01 15:20:10',
      level: 'error',
      user: 'system',
      action: 'Database connection failed',
      details: 'Failed to connect to database: timeout',
      ip: '127.0.0.1'
    },
    {
      id: '5',
      timestamp: '2024-06-01 15:15:45',
      level: 'success',
      user: 'jane.smith@email.com',
      action: 'Form submission',
      details: 'Form "Employee Registration" submitted successfully',
      ip: '198.51.100.23'
    },
    {
      id: '6',
      timestamp: '2024-06-01 15:10:22',
      level: 'info',
      user: 'admin@company.com',
      action: 'PDF uploaded',
      details: 'PDF file "contract.pdf" uploaded and processed',
      ip: '192.168.1.100'
    }
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleExportLogs = () => {
    // In real app, this would export logs to CSV/JSON
    console.log('Exporting logs...');
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              
              <Button onClick={handleExportLogs} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent Activity ({filteredLogs.length} entries)
            </CardTitle>
            <div className="text-sm text-gray-500">
              Last 24 hours
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Time</th>
                  <th className="text-left p-3 font-medium">Level</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">Details</th>
                  <th className="text-left p-3 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-500">
                      {log.timestamp}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(log.level)}
                        {getLevelBadge(log.level)}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{log.user}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{log.action}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-600">{log.details}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-gray-400 font-mono">{log.ip}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.level === 'success').length}</p>
                <p className="text-sm text-gray-500">Success</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.level === 'info').length}</p>
                <p className="text-sm text-gray-500">Info</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.level === 'warning').length}</p>
                <p className="text-sm text-gray-500">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.level === 'error').length}</p>
                <p className="text-sm text-gray-500">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemLogs; 
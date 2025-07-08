"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Plus, 
  Mail, 
  UserX, 
  Key, 
  RefreshCw,
  Shield,
  Crown
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'owner';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin?: string;
}

const UserManagement: React.FC = () => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'owner'>('admin');
  
  // Mock data - in real app, this would come from API
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    {
      id: '1',
      email: 'admin@company.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-15',
      lastLogin: '2024-06-01 10:30'
    },
    {
      id: '2',
      email: 'owner@company.com',
      role: 'owner',
      status: 'active',
      createdAt: '2024-01-01',
      lastLogin: '2024-06-01 09:15'
    },
    {
      id: '3',
      email: 'manager@company.com',
      role: 'admin',
      status: 'pending',
      createdAt: '2024-05-28',
    }
  ]);

  const handleCreateAdmin = () => {
    if (!newAdminEmail) return;
    
    const newAdmin: AdminUser = {
      id: Math.random().toString(36).substr(2, 9),
      email: newAdminEmail,
      role: newAdminRole,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setAdminUsers([...adminUsers, newAdmin]);
    setNewAdminEmail('');
  };

  const handleResendInvite = (userId: string) => {
    // In real app, this would call API to resend invite
    console.log('Resending invite to:', userId);
  };

  const handleResetPassword = (userId: string) => {
    // In real app, this would call API to reset password
    console.log('Resetting password for:', userId);
  };

  const handleDeactivateUser = (userId: string) => {
    setAdminUsers(adminUsers.map(user => 
      user.id === userId ? { ...user, status: 'inactive' } : user
    ));
  };

  const handleActivateUser = (userId: string) => {
    setAdminUsers(adminUsers.map(user => 
      user.id === userId ? { ...user, status: 'active' } : user
    ));
  };

  const getRoleIcon = (role: string) => {
    return role === 'owner' ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Admin User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Enter admin email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <select
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'owner')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <Button onClick={handleCreateAdmin} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Admin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Users ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-left p-3 font-medium">Last Login</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {user.createdAt}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {user.lastLogin || 'Never'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {user.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvite(user.id)}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Resend
                          </Button>
                        )}
                        {user.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetPassword(user.id)}
                            className="flex items-center gap-1"
                          >
                            <Key className="h-3 w-3" />
                            Reset
                          </Button>
                        )}
                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeactivateUser(user.id)}
                            className="flex items-center gap-1 text-red-600"
                          >
                            <UserX className="h-3 w-3" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleActivateUser(user.id)}
                            className="flex items-center gap-1 text-green-600"
                          >
                            <Users className="h-3 w-3" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Admin Role
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Upload and process PDFs</li>
                <li>• Build and customize forms</li>
                <li>• Map form fields to PDF fields</li>
                <li>• Publish forms for clients</li>
                <li>• View form submissions</li>
                <li>• Manage client users</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                Owner Role
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• All Admin permissions</li>
                <li>• Create and manage admin users</li>
                <li>• View system logs and analytics</li>
                <li>• Configure system settings</li>
                <li>• Monitor system health</li>
                <li>• Access billing and usage data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement; 
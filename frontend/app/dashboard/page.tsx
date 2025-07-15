"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAppStore, useUser } from '../../lib/store';
import { useSessionManager } from '../../lib/auth';
import { UserRole } from '../../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Settings, 
  LogOut,
  Menu,
  Home,
  Users,
  FileText,
  BarChart3,
  Shield,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserType {
  role: UserRole;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const USER_TYPES: Record<UserRole, UserType> = {
  owner: {
    role: 'owner',
    label: 'Owner',
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800'
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800'
  },
  client: {
    role: 'client',
    label: 'Client',
    icon: <User className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800'
  }
};

export default function DashboardPage() {
  const user = useUser();
  const { handleLogout } = useSessionManager();
  const router = useRouter();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserRole | null>(null);
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Set the highest level user type as default
    const userTypes = getUserTypes(user);
    if (userTypes.length > 0) {
      setSelectedUserType(userTypes[0].role);
    }
  }, [user, router]);

  const getUserTypes = (user: any): UserType[] => {
    const types: UserType[] = [];
    
    // Check if user has multiple roles (in a real app, this would come from the backend)
    // For now, we'll simulate based on the user's role
    if (user.role === 'owner') {
      types.push(USER_TYPES.owner, USER_TYPES.admin, USER_TYPES.client);
    } else if (user.role === 'admin') {
      types.push(USER_TYPES.admin, USER_TYPES.client);
    } else {
      types.push(USER_TYPES.client);
    }
    
    return types;
  };

  const handleUserTypeChange = (role: UserRole) => {
    setSelectedUserType(role);
    setShowUserTypeDropdown(false);
    toast.success(`Switched to ${USER_TYPES[role].label} view`);
  };

  const handleLogoutClick = () => {
    handleLogout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  const userTypes = getUserTypes(user);
  const currentUserType = selectedUserType ? USER_TYPES[selectedUserType] : null;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* User Info */}
          <div className="mt-2 flex items-center gap-2">
            {!sidebarCollapsed && (
              <div className="flex-1">
                {userTypes.length > 1 ? (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto"
                      onClick={() => setShowUserTypeDropdown(!showUserTypeDropdown)}
                    >
                      <div className="flex items-center gap-2">
                        {currentUserType?.icon}
                        <span className="text-sm font-medium">{currentUserType?.label}</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${showUserTypeDropdown ? 'rotate-90' : ''}`} />
                    </Button>
                    
                    {showUserTypeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        {userTypes.map((type) => (
                          <button
                            key={type.role}
                            onClick={() => handleUserTypeChange(type.role)}
                            className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 text-sm"
                          >
                            {type.icon}
                            {type.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-2">
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              {!sidebarCollapsed && "Home"}
            </Button>
            
            {currentUserType?.role === 'owner' && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {!sidebarCollapsed && "Manage Users"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/logs')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {!sidebarCollapsed && "System Logs"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {!sidebarCollapsed && "System Settings"}
                </Button>
              </>
            )}
            
            {currentUserType?.role === 'admin' && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/forms')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {!sidebarCollapsed && "Manage Forms"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {!sidebarCollapsed && "Analytics"}
                </Button>
              </>
            )}
            
            {currentUserType?.role === 'client' && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/forms')}
              >
                <FileText className="h-4 w-4 mr-2" />
                {!sidebarCollapsed && "My Forms"}
              </Button>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => router.push('/profile')}
          >
            <User className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && "Profile"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogoutClick}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && "Logout"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {user.name || user.email}
                </h1>
                <p className="text-gray-600 mt-2">
                  {currentUserType?.label} Dashboard
                </p>
              </div>
              
              {/* Create Form Button for Admin users */}
              {currentUserType?.role === 'admin' && (
                <Button 
                  onClick={() => router.push('/workflow')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
              )}
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Forms</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed Today</span>
                      <Badge variant="secondary">5</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Review</span>
                      <Badge variant="secondary">3</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium">Form submitted</p>
                      <p className="text-gray-600">2 hours ago</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">PDF uploaded</p>
                      <p className="text-gray-600">1 day ago</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Field mapping updated</p>
                      <p className="text-gray-600">2 days ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Create New Form
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/profile')}
                    >
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    {currentUserType?.role === 'admin' && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => router.push('/admin/forms')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Forms
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
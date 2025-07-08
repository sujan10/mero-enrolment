"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  Save, 
  Shield, 
  Mail, 
  Database,
  HardDrive,
  Bell,
  Lock,
  Globe,
  Zap
} from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // Security Settings
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    requireTwoFactor: false,
    passwordMinLength: 8,
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@company.com',
    smtpPassword: '********',
    fromEmail: 'noreply@company.com',
    fromName: 'PDF Form Automation',
    
    // Storage Settings
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'jpg', 'png'],
    storageQuota: 1000,
    
    // Notification Settings
    emailNotifications: true,
    systemAlerts: true,
    maintenanceMode: false,
    
    // General Settings
    siteName: 'PDF Form Automation',
    siteUrl: 'https://forms.company.com',
    timezone: 'UTC',
    language: 'en'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // In real app, this would save to backend
    console.log('Settings saved:', settings);
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      requireTwoFactor: false,
      passwordMinLength: 8,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@company.com',
      smtpPassword: '********',
      fromEmail: 'noreply@company.com',
      fromName: 'PDF Form Automation',
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'jpg', 'png'],
      storageQuota: 1000,
      emailNotifications: true,
      systemAlerts: true,
      maintenanceMode: false,
      siteName: 'PDF Form Automation',
      siteUrl: 'https://forms.company.com',
      timezone: 'UTC',
      language: 'en'
    });
  };

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
              <Input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                min="1"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                min="5"
                max="480"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password Min Length</label>
              <Input
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                min="6"
                max="20"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireTwoFactor"
                checked={settings.requireTwoFactor}
                onChange={(e) => setSettings({...settings, requireTwoFactor: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="requireTwoFactor" className="text-sm font-medium">
                Require Two-Factor Authentication
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Host</label>
              <Input
                value={settings.smtpHost}
                onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Port</label>
              <Input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({...settings, smtpPort: parseInt(e.target.value)})}
                placeholder="587"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Username</label>
              <Input
                value={settings.smtpUser}
                onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                placeholder="noreply@company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Password</label>
              <Input
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
                placeholder="********"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">From Email</label>
              <Input
                value={settings.fromEmail}
                onChange={(e) => setSettings({...settings, fromEmail: e.target.value})}
                placeholder="noreply@company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">From Name</label>
              <Input
                value={settings.fromName}
                onChange={(e) => setSettings({...settings, fromName: e.target.value})}
                placeholder="PDF Form Automation"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max File Size (MB)</label>
              <Input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                min="1"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Storage Quota (GB)</label>
              <Input
                type="number"
                value={settings.storageQuota}
                onChange={(e) => setSettings({...settings, storageQuota: parseInt(e.target.value)})}
                min="1"
                max="10000"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Allowed File Types</label>
              <div className="flex gap-2 flex-wrap">
                {['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.allowedFileTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings, 
                            allowedFileTypes: [...settings.allowedFileTypes, type]
                          });
                        } else {
                          setSettings({
                            ...settings, 
                            allowedFileTypes: settings.allowedFileTypes.filter(t => t !== type)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{type.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium">
                Enable Email Notifications
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="systemAlerts"
                checked={settings.systemAlerts}
                onChange={(e) => setSettings({...settings, systemAlerts: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="systemAlerts" className="text-sm font-medium">
                Enable System Alerts
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="maintenanceMode" className="text-sm font-medium">
                Maintenance Mode
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                placeholder="PDF Form Automation"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Site URL</label>
              <Input
                value={settings.siteUrl}
                onChange={(e) => setSettings({...settings, siteUrl: e.target.value})}
                placeholder="https://forms.company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline">
            Test Email Settings
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 
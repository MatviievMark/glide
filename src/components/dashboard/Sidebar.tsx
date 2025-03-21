import React from 'react';
import { Home, Book, Calendar, FileText, MessageSquare, Settings } from 'lucide-react';

export interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userName?: string;
  userMajor?: string;
  userInitials?: string;
}

const defaultMenuItems: SidebarItem[] = [
  { id: 'dashboard', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
  { id: 'courses', icon: <Book className="w-5 h-5" />, label: 'Courses' },
  { id: 'schedule', icon: <Calendar className="w-5 h-5" />, label: 'Schedule' },
  { id: 'assignments', icon: <FileText className="w-5 h-5" />, label: 'Assignments' },
  { id: 'messages', icon: <MessageSquare className="w-5 h-5" />, label: 'Messages' }
];

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userName,
  userMajor,
  userInitials,
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-700">Glide</h1>
      </div>
      
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
            {userInitials}
          </div>
          <div>
            <p className="font-medium text-gray-800">{userName}</p>
            <p className="text-sm text-gray-500">{userMajor}</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          {defaultMenuItems.map(item => (
            <button
              key={item.id}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200">
        <button 
          className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => onTabChange('settings')}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

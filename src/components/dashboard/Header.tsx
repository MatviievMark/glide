import React from 'react';
import { Search, Bell, User } from 'lucide-react';

export interface HeaderProps {
  onSearchChange?: (value: string) => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  hasNotifications?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onSearchChange,
  onNotificationsClick,
  onProfileClick,
  hasNotifications = false,
}) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="relative w-64">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          onClick={onNotificationsClick}
        >
          <Bell className="w-6 h-6" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
        <button 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          onClick={onProfileClick}
        >
          <User className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;

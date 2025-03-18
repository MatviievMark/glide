import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';

export interface AssignmentItemProps {
  id: number | string;
  title: string;
  course: string;
  dueDate: string;
  urgent?: boolean;
  onClick?: () => void;
}

const AssignmentItem: React.FC<AssignmentItemProps> = ({
  title,
  course,
  dueDate,
  urgent = false,
  onClick,
}) => {
  return (
    <div 
      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
      onClick={onClick}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${urgent ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center`}>
        {urgent ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : (
          <FileText className="w-5 h-5 text-blue-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-500">{course} • Due {dueDate}</p>
      </div>
    </div>
  );
};

export default AssignmentItem;

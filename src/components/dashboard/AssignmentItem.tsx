import React from 'react';
import { AlertCircle, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface AssignmentItemProps {
  id?: number | string;
  title: string;
  courseName?: string;
  dueDate?: string;
  formattedDueDate?: string;
  status?: 'upcoming' | 'past' | 'missing';
  urgent?: boolean;
  score?: number;
  pointsPossible?: number;
  onClick?: () => void;
}

const AssignmentItem: React.FC<AssignmentItemProps> = ({
  title,
  courseName,
  dueDate,
  formattedDueDate,
  status = 'upcoming',
  urgent = false,
  score,
  pointsPossible,
  onClick,
}) => {
  // Format the due date if provided
  let displayDate = formattedDueDate;
  if (!displayDate && dueDate) {
    try {
      // Try to parse and format the date
      const parsedDate = parseISO(dueDate);
      displayDate = format(parsedDate, 'MMM d, yyyy');
    } catch (error) {
      // If parsing fails, just use the raw date
      displayDate = dueDate;
    }
  }

  // Determine icon and colors based on status
  let icon;
  let bgColor;
  let textColor;

  if (urgent) {
    icon = <AlertCircle className="w-5 h-5 text-red-600" />;
    bgColor = 'bg-red-100';
    textColor = 'text-red-600';
  } else if (status === 'upcoming') {
    icon = <Clock className="w-5 h-5 text-blue-600" />;
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-600';
  } else if (status === 'past') {
    icon = <CheckCircle className="w-5 h-5 text-green-600" />;
    bgColor = 'bg-green-100';
    textColor = 'text-green-600';
  } else if (status === 'missing') {
    icon = <XCircle className="w-5 h-5 text-red-600" />;
    bgColor = 'bg-red-100';
    textColor = 'text-red-600';
  } else {
    icon = <FileText className="w-5 h-5 text-blue-600" />;
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-600';
  }

  return (
    <div
      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
      onClick={onClick}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {courseName && `${courseName} • `}
            {displayDate && `Due ${displayDate}`}
          </p>
          {(score !== undefined || pointsPossible !== undefined) && (
            <p className="text-xs font-medium">
              {score !== undefined ? (
                <span className={score > 0 ? 'text-green-600' : 'text-gray-600'}>
                  {score}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
              {pointsPossible !== undefined && (
                <span className="text-gray-500">/{pointsPossible}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentItem;

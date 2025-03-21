import React from 'react';

export interface AnnouncementItemProps {
  id: number | string;
  title: string;
  date: string;
  content: string;
  course?: string;
  onClick?: () => void;
}

const AnnouncementItem: React.FC<AnnouncementItemProps> = ({
  title,
  date,
  content,
  course,
  onClick,
}) => {
  return (
    <div 
      className="border-l-4 border-blue-600 pl-4 py-1 cursor-pointer hover:bg-blue-50 transition-colors rounded-r-lg"
      onClick={onClick}
    >
      <p className="text-sm font-medium text-gray-800">{title}</p>
      <div className="flex justify-between items-center mb-1">
        <p className="text-xs text-gray-500">{date}</p>
        {course && <p className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{course}</p>}
      </div>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  );
};

export default AnnouncementItem;

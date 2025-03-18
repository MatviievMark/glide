import React from 'react';

export interface AnnouncementItemProps {
  id: number | string;
  title: string;
  date: string;
  content: string;
  onClick?: () => void;
}

const AnnouncementItem: React.FC<AnnouncementItemProps> = ({
  title,
  date,
  content,
  onClick,
}) => {
  return (
    <div 
      className="border-l-4 border-blue-600 pl-4 py-1 cursor-pointer hover:bg-blue-50 transition-colors rounded-r-lg"
      onClick={onClick}
    >
      <p className="text-sm font-medium text-gray-800">{title}</p>
      <p className="text-xs text-gray-500 mb-1">{date}</p>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  );
};

export default AnnouncementItem;

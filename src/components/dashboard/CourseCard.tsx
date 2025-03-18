import React from 'react';
import { Settings } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const courseCardVariants = cva(
  'rounded-xl p-5 transition-colors duration-200 flex flex-col items-center justify-center h-44 cursor-pointer relative overflow-hidden shadow-md',
  {
    variants: {
      color: {
        blue: 'bg-blue-200 hover:bg-blue-300 text-blue-800',
        purple: 'bg-purple-200 hover:bg-purple-300 text-purple-800',
        green: 'bg-green-200 hover:bg-green-300 text-green-800',
        amber: 'bg-amber-200 hover:bg-amber-300 text-amber-800',
        pink: 'bg-pink-200 hover:bg-pink-300 text-pink-800',
        indigo: 'bg-indigo-200 hover:bg-indigo-300 text-indigo-800',
        emerald: 'bg-emerald-200 hover:bg-emerald-300 text-emerald-800',
        rose: 'bg-rose-200 hover:bg-rose-300 text-rose-800',
        gray: 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-2 border-dashed border-gray-300',
      },
    },
    defaultVariants: {
      color: 'blue',
    },
  }
);

type HTMLAttributesWithoutColor = Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>;

export interface CourseCardProps
  extends HTMLAttributesWithoutColor,
    VariantProps<typeof courseCardVariants> {
  courseCode?: string;
  courseName?: string;
  instructor?: string;
  progress?: number;
  isAddCard?: boolean;
  onSettingsClick?: (e: React.MouseEvent) => void;
}

const CourseCard = React.forwardRef<HTMLDivElement, CourseCardProps>(
  ({ 
    className, 
    color, 
    courseCode, 
    courseName, 
    instructor, 
    progress, 
    isAddCard = false,
    onSettingsClick,
    ...props 
  }, ref) => {
    if (isAddCard) {
      return (
        <div
          className={courseCardVariants({ color: 'gray', className })}
          ref={ref}
          {...props}
        >
          <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-sm font-medium">Add Course</p>
        </div>
      );
    }

    return (
      <div
        className={courseCardVariants({ color, className })}
        ref={ref}
        {...props}
      >
        {courseCode && (
          <div className="absolute top-2 left-2 text-xs font-semibold bg-white bg-opacity-50 px-2 py-1 rounded shadow-sm">
            {(() => {
              // Extract just the class code like "CSC 122" from formats like "2025SP CSC-122-1GTF1"
              const match = courseCode.match(/([A-Z]{3})-?(\d{3})/i);
              return match ? `${match[1]} ${match[2]}` : courseCode;
            })()}
          </div>
        )}
        
        {onSettingsClick && (
          <button 
            className="absolute top-2 right-2 hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onSettingsClick(e);
            }}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex flex-col items-center justify-center text-center h-full">
          <h4 className="font-bold text-lg mb-2">{courseName}</h4>
          <p className="text-sm opacity-80">{instructor}</p>
        </div>
        
        {progress !== undefined && (
          <div className="absolute bottom-2 right-2 text-xs font-semibold bg-white bg-opacity-50 px-2 py-1 rounded shadow-sm">
            {progress}%
          </div>
        )}
      </div>
    );
  }
);

CourseCard.displayName = 'CourseCard';

export { CourseCard, courseCardVariants };

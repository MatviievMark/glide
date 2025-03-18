import React, { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva(
  'bg-white rounded-xl shadow-sm p-6 border border-gray-100',
  {
    variants: {
      variant: {
        default: '',
        success: '',
        warning: '',
        info: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  subtitleColor?: 'default' | 'success' | 'warning' | 'danger';
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    className, 
    variant, 
    title, 
    value, 
    icon, 
    subtitle,
    subtitleColor = 'default',
    ...props 
  }, ref) => {
    const subtitleColorClasses = {
      default: 'text-gray-600',
      success: 'text-green-600',
      warning: 'text-amber-600',
      danger: 'text-red-600',
    };

    const iconBackgroundClasses = {
      default: 'bg-gray-100',
      success: 'bg-green-100',
      warning: 'bg-amber-100',
      danger: 'bg-red-100',
      info: 'bg-blue-100',
    };

    const iconColorClasses = {
      default: 'text-gray-600',
      success: 'text-green-600',
      warning: 'text-amber-600',
      danger: 'text-red-600',
      info: 'text-blue-600',
    };

    return (
      <div
        className={statCardVariants({ variant, className })}
        ref={ref}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-700">{title}</h3>
          <div className={`p-2 ${iconBackgroundClasses[variant || 'default']} rounded-lg`}>
            <div className={iconColorClasses[variant || 'default']}>{icon}</div>
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {subtitle && (
          <p className={`text-sm ${subtitleColorClasses[subtitleColor]} mt-1`}>{subtitle}</p>
        )}
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

export { StatCard, statCardVariants };

import React from 'react';
import { Avatar, AvatarProps, AvatarSize } from './Avatar';
interface AvatarGroupProps {
  avatars: Omit<AvatarProps, 'size'>[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}
export const AvatarGroup = ({
  avatars,
  max,
  size = 'md',
  className = ''
}: AvatarGroupProps) => {
  const displayAvatars = max ? avatars.slice(0, max) : avatars;
  const remainingCount = max ? Math.max(0, avatars.length - max) : 0;
  return (
    <div className={`flex items-center ${className}`}>
      {displayAvatars.map((avatar, index) =>
      <div
        key={index}
        className={`
            ${index !== 0 ? '-ml-2' : ''}
            relative
            hover:z-10
          `}>
        
          <Avatar {...avatar} size={size} />
        </div>
      )}
      {remainingCount > 0 &&
      <div
        className={`
            -ml-2
            relative
            hover:z-10
            inline-flex
            items-center
            justify-center
            bg-gray-200
            ${size ? `${sizeMap[size]}` : ''}
            rounded-full
            font-medium
            text-gray-600
          `}>
        
          +{remainingCount}
        </div>
      }
    </div>);

};
const sizeMap: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};
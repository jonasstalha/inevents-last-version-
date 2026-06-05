// Lucide Icon component for the app
// Uses outline-based icons (Feather/Lucide style)

import { LucideActivity, LucideAlertCircle, LucideAward, LucideBell, LucideBookmark, LucideCalendar, LucideCamera, LucideCheck, LucideCheckCircle, LucideChevronLeft, LucideChevronRight, LucideClock, LucideCloud, LucideCompass, LucideCopy, LucideCreditCard, LucideDollarSign, LucideDownload, LucideEdit2, LucideEye, LucideEyeOff, LucideFile, LucideFileText, LucideFilter, LucideGift, LucideGrid, LucideHeart, LucideHelpCircle, LucideHome, LucideImage, LucideInfo, LucideList, LucideLock, LucideMail, LucideMapPin, LucideMenu, LucideMessageCircle, LucideMinus, LucideMinusCircle, LucideMoon, LucideMusic, LucidePaperclip, LucidePhone, LucidePlus, LucidePlusCircle, LucideProps, LucideSearch, LucideSend, LucideSettings, LucideShare2, LucideShoppingCart, LucideSliders, LucideStar, LucideSun, LucideThermometer, LucideTrash2, LucideTrendingDown, LucideTrendingUp, LucideUpload, LucideUser, LucideVideo, LucideWallet, LucideWind, LucideX, LucideZap } from 'lucide-react-native';
import React from 'react';

// Icon mapping for tab and other common icons
export type IconName = 
  | 'home'
  | 'compass'
  | 'search'
  | 'user'
  | 'shopping-cart'
  | 'bell'
  | 'settings'
  | 'chevron-left'
  | 'chevron-right'
  | 'menu'
  | 'x'
  | 'heart'
  | 'share-2'
  | 'star'
  | 'map-pin'
  | 'calendar'
  | 'clock'
  | 'check'
  | 'check-circle'
  | 'alert-circle'
  | 'info'
  | 'help-circle'
  | 'mail'
  | 'phone'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'plus'
  | 'minus'
  | 'plus-circle'
  | 'minus-circle'
  | 'trash-2'
  | 'edit-2'
  | 'copy'
  | 'download'
  | 'upload'
  | 'file'
  | 'file-text'
  | 'image'
  | 'camera'
  | 'video'
  | 'music'
  | 'message-circle'
  | 'send'
  | 'paperclip'
  | 'filter'
  | 'sliders'
  | 'grid'
  | 'list'
  | 'bookmark'
  | 'credit-card'
  | 'dollar-sign'
  | 'wallet'
  | 'trending-up'
  | 'trending-down'
  | 'activity'
  | 'award'
  | 'gift'
  | 'zap'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'wind'
  | 'thermometer';

interface LucideIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const iconMap: Record<IconName, React.ComponentType<LucideProps>> = {
  'home': LucideHome,
  'compass': LucideCompass,
  'search': LucideSearch,
  'user': LucideUser,
  'shopping-cart': LucideShoppingCart,
  'bell': LucideBell,
  'settings': LucideSettings,
  'chevron-left': LucideChevronLeft,
  'chevron-right': LucideChevronRight,
  'menu': LucideMenu,
  'x': LucideX,
  'heart': LucideHeart,
  'share-2': LucideShare2,
  'star': LucideStar,
  'map-pin': LucideMapPin,
  'calendar': LucideCalendar,
  'clock': LucideClock,
  'check': LucideCheck,
  'check-circle': LucideCheckCircle,
  'alert-circle': LucideAlertCircle,
  'info': LucideInfo,
  'help-circle': LucideHelpCircle,
  'mail': LucideMail,
  'phone': LucidePhone,
  'lock': LucideLock,
  'eye': LucideEye,
  'eye-off': LucideEyeOff,
  'plus': LucidePlus,
  'minus': LucideMinus,
  'plus-circle': LucidePlusCircle,
  'minus-circle': LucideMinusCircle,
  'trash-2': LucideTrash2,
  'edit-2': LucideEdit2,
  'copy': LucideCopy,
  'download': LucideDownload,
  'upload': LucideUpload,
  'file': LucideFile,
  'file-text': LucideFileText,
  'image': LucideImage,
  'camera': LucideCamera,
  'video': LucideVideo,
  'music': LucideMusic,
  'message-circle': LucideMessageCircle,
  'send': LucideSend,
  'paperclip': LucidePaperclip,
  'filter': LucideFilter,
  'sliders': LucideSliders,
  'grid': LucideGrid,
  'list': LucideList,
  'bookmark': LucideBookmark,
  'credit-card': LucideCreditCard,
  'dollar-sign': LucideDollarSign,
  'wallet': LucideWallet,
  'trending-up': LucideTrendingUp,
  'trending-down': LucideTrendingDown,
  'activity': LucideActivity,
  'award': LucideAward,
  'gift': LucideGift,
  'zap': LucideZap,
  'sun': LucideSun,
  'moon': LucideMoon,
  'cloud': LucideCloud,
  'wind': LucideWind,
  'thermometer': LucideThermometer,
};

export function LucideIcon({ name, size = 24, color = '#000', strokeWidth = 1.5 }: LucideIconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in LucideIcon mapping`);
    return null;
  }
  
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
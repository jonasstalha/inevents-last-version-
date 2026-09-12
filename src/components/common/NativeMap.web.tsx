import { View } from 'react-native';

export default function NativeMap({ children, style }: any) {
  return <View style={style}>{children}</View>;
}

export function Marker() {
  return null;
}

export function Circle() {
  return null;
}

export const PROVIDER_GOOGLE = undefined;
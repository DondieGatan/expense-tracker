import React from 'react';

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

// react-native-gesture-handler's Swipeable doesn't bundle cleanly for web in
// this Metro config, and swipe gestures aren't a native pattern on web
// anyway — the row stays tappable to edit, same as before this feature.
export default function SwipeableRow({ children }: Props) {
  return <>{children}</>;
}

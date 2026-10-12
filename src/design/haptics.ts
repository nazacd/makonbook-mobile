import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics only at moments that earn them: a task finished, a task failed, a
// discrete choice changed. Never on ordinary taps — over-feedback trains
// people to ignore all of it.
//
// On Android this uses the system haptics engine (performHapticFeedback),
// which feels like iOS's and needs no VIBRATE permission — app.json blocks it.
// Failures are ignored: feedback must never break the action it accompanies.

export function success() {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}

export function error() {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject).catch(() => {});
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
}

export function selection() {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick).catch(() => {});
  } else {
    Haptics.selectionAsync().catch(() => {});
  }
}

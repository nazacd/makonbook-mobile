import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { CheckInResult } from '@/components/CheckInResult';
import { Notice } from '@/components/Notice';
import { attendanceLink, parseAttendanceLink } from '@/lib/attendance/code';

// makonbookmobile://att/<session>/<window>/<sig> — what the QR encodes. A
// student who scans it with the phone's own camera lands here.
export default function CheckInLink() {
  const { sessionId, window, sig } = useLocalSearchParams<{ sessionId: string; window: string; sig: string }>();
  const code = parseAttendanceLink(attendanceLink(sessionId, Number(window), sig));
  const done = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!code) {
    return (
      <View className="flex-1 justify-center gap-4 bg-brand px-6">
        <Notice tone="error" title="Not a valid code" message="This link isn’t a MakonBook attendance code." />
        <Button label="Done" onPress={done} />
      </View>
    );
  }
  return <CheckInResult code={code} onDone={done} />;
}

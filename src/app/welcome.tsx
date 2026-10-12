import { router } from 'expo-router';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';

// What someone sees when nobody is signed in on this phone. Two clear paths:
// students sign in; a new student, at the front desk, takes the Level Check
// without an account.
export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-4">
          <View className="flex-1 items-center justify-center gap-5">
            <Image
              source={require('../../assets/makonbook-icon.png')}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View className="items-center gap-2">
              <Text variant="largeTitle" className="text-white" accessibilityRole="header">
                MakonBook
              </Text>
              <Text variant="body" style={{ color: colors.secondaryText, textAlign: 'center' }}>
                Your SAT MAKON classes, practice and attendance.
              </Text>
            </View>
          </View>

          <View className="w-full max-w-md gap-3 self-center">
            <Button label="Sign in" onPress={() => router.push('/sign-in')} />
            <Button
              label="Take the Level Check"
              variant="secondary"
              onPress={() => router.push('/level-check')}
              accessibilityHint="Placement test for new students. No account needed."
            />
            <Text variant="footnote" style={{ color: colors.tertiaryText, textAlign: 'center' }}>
              The Level Check is for new students and needs no account.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

import * as Linking from 'expo-linking';
import { Image, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useColors } from '@/design/colors';
import { STORE_URL } from '@/lib/config';

// Shown instead of the whole app when this build is older than the API
// supports (spec D15). There is deliberately no way past it.
export function UpdateRequired() {
  const colors = useColors();
  const storeUrl = STORE_URL;
  const storeName = Platform.OS === 'ios' ? 'the App Store' : 'Google Play';
  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-4">
          <View className="flex-1 items-center justify-center gap-5">
            <Image
              source={require('../../assets/makonbook-icon.png')}
              style={{ width: 96, height: 96 }}
              resizeMode="contain"
            />
            <View className="items-center gap-2">
              <Text variant="title" className="text-ink" accessibilityRole="header">
                Update MakonBook
              </Text>
              <Text variant="body" style={{ color: colors.ink2, textAlign: 'center' }}>
                This version is no longer supported. Install the latest one from {storeName} to keep
                using the app.
              </Text>
            </View>
          </View>
          {storeUrl && (
            <Button
              label="Update"
              onPress={() => Linking.openURL(storeUrl)}
              style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

import { View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { colors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { LANG_NAME, type Lang } from '@/lib/parent/i18n';
import { useParent } from '@/lib/parent/session';

const LANGS: Lang[] = ['uz', 'ru'];

// O‘zbekcha | Русский, each written in its own language so either reader
// finds theirs.
export function LangSwitch() {
  const { lang, setLang } = useParent();
  return (
    <View className="flex-row gap-1 rounded-2xl bg-surface p-1" accessibilityRole="radiogroup">
      {LANGS.map((l) => {
        const on = l === lang;
        return (
          <PressableScale
            key={l}
            style={{ flex: 1 }}
            className={`h-10 items-center justify-center rounded-xl ${on ? 'bg-accent' : ''}`}
            onPress={() => {
              if (on) return;
              haptics.selection();
              setLang(l);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}>
            <Text variant="subhead" style={{ color: on ? colors.text : colors.secondaryText, fontWeight: '600' }}>
              {LANG_NAME[l]}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

import { View } from 'react-native';

import { Flag } from '@/components/parent/Flag';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { LANG_NAME, type Lang } from '@/lib/parent/i18n';
import { useParent } from '@/lib/parent/session';

const LANGS: Lang[] = ['uz', 'ru'];

// Two flags at the top of the parent's screens: Uzbek and Russian, in a
// segmented pill; the chosen one sits on the page colour, the other dimmed.
export function LangSwitch() {
  const colors = useColors();
  const { lang, setLang } = useParent();
  return (
    <View className="flex-row rounded-full p-1" style={{ gap: 2, backgroundColor: colors.surface2 }} accessibilityRole="radiogroup">
      {LANGS.map((l) => {
        const on = l === lang;
        return (
          <PressableScale
            key={l}
            pressedScale={0.9}
            // The size on the outer view (style), the centring on the Pressable inside (className).
            className="flex-1 items-center justify-center"
            style={{ width: 48, height: 38, borderRadius: 19, opacity: on ? 1 : 0.45, backgroundColor: on ? colors.bg : 'transparent' }}
            hitSlop={4}
            onPress={() => {
              if (on) return;
              haptics.selection();
              setLang(l);
            }}
            accessibilityRole="radio"
            accessibilityLabel={LANG_NAME[l]}
            accessibilityState={{ checked: on }}>
            <Flag lang={l} width={26} />
          </PressableScale>
        );
      })}
    </View>
  );
}

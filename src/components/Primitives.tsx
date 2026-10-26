import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, ui } from './theme';
export function Button({ label, onPress, icon: Icon, secondary = false, danger = false, disabled = false, style }: { label: string; onPress: () => void; icon?: LucideIcon; secondary?: boolean; danger?: boolean; disabled?: boolean; style?: ViewStyle }) {
  const foreground = secondary ? (danger ? colors.red : colors.ink) : colors.paper;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? colors.softGreen : danger ? colors.red : colors.ink, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}>
    {Icon && <Icon size={18} color={foreground} />}<Text style={[styles.label, { color: foreground }]}>{label}</Text>
  </Pressable>;
}
export function IconButton({ label, icon: Icon, onPress }: { label: string; icon: LucideIcon; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1 }]}><Icon size={22} color={colors.ink} /></Pressable>;
}
export function Badge({ children, amber = false }: { children: ReactNode; amber?: boolean }) {
  return <View style={{ backgroundColor: amber ? colors.paleAmber : colors.softGreen, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start' }}><Text style={{ fontSize: 11, fontWeight: '700', color: amber ? colors.amber : colors.green }}>{children}</Text></View>;
}
export function Detail({ label, value }: { label: string; value: string }) { return <View style={{ flex: 1, gap: 5 }}><Text style={ui.small}>{label}</Text><Text style={ui.h3}>{value}</Text></View>; }
const styles = StyleSheet.create({ button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 }, label: { fontSize: 14, fontWeight: '700', textAlign: 'center', flexShrink: 1 }, iconButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.paper } });

import { StyleSheet } from 'react-native';
export const colors = { ink: '#193B32', muted: '#64736B', canvas: '#F4F5ED', paper: '#FFFFFF', line: '#DDE4DA', green: '#28634D', softGreen: '#E6EDDF', orange: '#F5AC64', amber: '#855021', paleAmber: '#FFF0DC', red: '#A83830' };
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 22, gap: 18, paddingBottom: 36 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { backgroundColor: colors.paper, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.line, gap: 14 },
  dark: { backgroundColor: colors.ink, borderRadius: 24, padding: 24, gap: 16 },
  title: { fontSize: 31, fontWeight: '700', color: colors.ink, letterSpacing: -1 },
  h2: { fontSize: 21, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
  text: { fontSize: 15, color: colors.ink, lineHeight: 23 }, small: { fontSize: 13, lineHeight: 20, color: colors.muted },
  eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.ink },
  notice: { borderRadius: 14, padding: 14, backgroundColor: colors.paleAmber, gap: 6 },
  divider: { height: 1, backgroundColor: colors.line },
});

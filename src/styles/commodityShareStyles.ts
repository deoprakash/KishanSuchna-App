import { StyleSheet } from 'react-native';

export const commodityShareStyles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#27ae60', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addBtnText: { color: 'white', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 40 },
  item: { padding: 12, borderRadius: 8, backgroundColor: '#fff', marginBottom: 10, elevation: 2 },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { color: '#555', marginTop: 4 },
  actions: { justifyContent: 'space-between', marginLeft: 10 },
  actionBtn: { backgroundColor: '#3498db', padding: 8, borderRadius: 6, marginBottom: 6 },
  actionText: { color: 'white' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 8, padding: 16, width: '95%', maxWidth: 600, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: '#ccc', marginHorizontal: 4 },
  typeBtnActive: { backgroundColor: '#27ae60', borderColor: '#27ae60' },
  typeText: { color: '#333' },
  typeTextActive: { color: 'white', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginLeft: 8 },
  modalBtnText: { color: 'white', fontWeight: '700' },
});

export default commodityShareStyles;

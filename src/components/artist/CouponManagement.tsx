import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { fetchServicesByArtistId } from '../../firebase/artistServices';
import {
  Coupon,
  createCoupon,
  deleteCoupon,
  getCouponsByArtist,
  updateCoupon,
} from '../../firebase/couponService';

const PRIMARY = '#6a0dad';
const BG = '#f5f5f5';
const CARD_BG = '#fff';

export default function CouponManagement() {
  const { user: authUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // form fields
  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [maxUses, setMaxUses] = useState('');
  const [expiryDateStr, setExpiryDateStr] = useState('');
  const [scope, setScope] = useState<'all' | 'specific'>('all');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const [svcs, cps] = await Promise.all([
        fetchServicesByArtistId(authUser.uid),
        getCouponsByArtist(authUser.uid),
      ]);
      setServices(svcs);
      setCoupons(cps);
    } catch (e: any) {
      console.error('fetchData', e);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setCode('');
    setDiscountValue('');
    setDiscountType('percentage');
    setMaxUses('');
    setExpiryDateStr('');
    setScope('all');
    setSelectedServiceId('');
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let c = '';
    for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
    setCode(c);
  };

  const parseDate = (str: string): Date | null => {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const handleCreate = async () => {
    if (!authUser) { Alert.alert('Error', 'Not logged in'); return; }
    if (!code.trim()) { Alert.alert('Error', 'Enter a coupon code'); return; }
    const dv = parseFloat(discountValue);
    if (!discountValue || isNaN(dv) || dv <= 0) { Alert.alert('Error', 'Enter a valid discount value'); return; }
    const mu = parseInt(maxUses, 10);
    if (!maxUses || isNaN(mu) || mu <= 0) { Alert.alert('Error', 'Enter max uses'); return; }
    if (!expiryDateStr.trim()) { Alert.alert('Error', 'Enter expiry date (YYYY-MM-DD)'); return; }
    const expiryDate = parseDate(expiryDateStr.trim());
    if (!expiryDate) { Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD'); return; }
    if (expiryDate <= new Date()) { Alert.alert('Error', 'Expiry date must be in the future'); return; }
    if (scope === 'specific' && !selectedServiceId) { Alert.alert('Error', 'Select a service'); return; }

    setSaving(true);
    try {
      const serviceId = scope === 'all' ? 'all' : selectedServiceId;
      const serviceName = scope === 'all' ? 'All Services' : (services.find(s => s.id === selectedServiceId)?.title || 'Service');
      await createCoupon({
        code: code.trim().toUpperCase(),
        serviceId,
        serviceName,
        artistId: authUser.uid,
        artistName: authUser.name || authUser.email || 'Artist',
        discountType,
        discountValue: dv,
        maxUses: mu,
        isActive: true,
        expiryDate,
        description: '',
        minOrderValue: 0,
      });
      Alert.alert('Success', 'Coupon created');
      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await updateCoupon(id, { isActive: !current });
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Coupon', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteCoupon(id);
          setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Failed to delete');
        }
      }},
    ]);
  };

  const renderCoupon = ({ item }: { item: Coupon }) => {
    const expired = item.expiryDate <= new Date();
    const statusColor = expired ? '#999' : item.isActive ? '#2e7d32' : '#d32f2f';
    const statusLabel = expired ? 'Expired' : item.isActive ? 'Active' : 'Inactive';
    const discountLabel = item.discountType === 'percentage' ? `${item.discountValue}% OFF` : `${item.discountValue} MAD OFF`;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.svcName}>{item.serviceName}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.cardMid}>
          <Text style={styles.discount}>{discountLabel}</Text>
          <View style={styles.usageRow}>
            <Ionicons name="people-outline" size={13} color="#888" />
            <Text style={styles.usageText}>{item.currentUses}/{item.maxUses} used</Text>
          </View>
          <Text style={styles.expiry}>Exp: {item.expiryDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.cardActions}>
          <View style={styles.toggleRow}>
            <Text style={{ fontSize: 13, color: '#333' }}>Active</Text>
            <Switch
              value={item.isActive && !expired}
              disabled={expired}
              onValueChange={() => handleToggle(item.id!, item.isActive)}
              trackColor={{ false: '#ccc', true: PRIMARY }}
              thumbColor={item.isActive ? PRIMARY : '#f4f3f4'}
            />
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id!)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const selectedSvcName = services.find(s => s.id === selectedServiceId)?.title;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Coupons</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowModal(true); }}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={coupons}
        keyExtractor={item => item.id!}
        renderItem={renderCoupon}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="pricetag-outline" size={48} color="#ccc" />
            <Text style={{ marginTop: 12, fontSize: 16, color: '#999' }}>No coupons yet</Text>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Coupon</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Code</Text>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={code}
                  onChangeText={setCode}
                  placeholder="e.g. SUMMER20"
                  autoCapitalize="characters"
                />
                <TouchableOpacity onPress={generateCode} style={styles.genBtn}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Generate</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Discount</Text>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
                <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' }}>
                  <TouchableOpacity
                    onPress={() => setDiscountType('percentage')}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: discountType === 'percentage' ? PRIMARY : '#fafafa' }}
                  >
                    <Text style={{ fontWeight: '600', fontSize: 14, color: discountType === 'percentage' ? '#fff' : '#666' }}>%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDiscountType('fixed')}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: discountType === 'fixed' ? PRIMARY : '#fafafa' }}
                  >
                    <Text style={{ fontWeight: '600', fontSize: 14, color: discountType === 'fixed' ? '#fff' : '#666' }}>MAD</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Max Uses</Text>
                  <TextInput
                    style={styles.input}
                    value={maxUses}
                    onChangeText={setMaxUses}
                    placeholder="Unlimited"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Expires (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={expiryDateStr}
                    onChangeText={setExpiryDateStr}
                    placeholder="2025-12-31"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, marginTop: 4, textTransform: 'uppercase' }}>Apply To</Text>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => { setScope('all'); setSelectedServiceId(''); }}
                  style={[styles.scopeBtn, scope === 'all' && styles.scopeBtnActive, { marginRight: 8 }]}
                >
                  <Text style={{ fontWeight: '600', fontSize: 13, color: scope === 'all' ? PRIMARY : '#666' }}>All Services</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setScope('specific')}
                  style={[styles.scopeBtn, scope === 'specific' && styles.scopeBtnActive]}
                >
                  <Text style={{ fontWeight: '600', fontSize: 13, color: scope === 'specific' ? PRIMARY : '#666' }}>Specific Service</Text>
                </TouchableOpacity>
              </View>

              {scope === 'specific' && (
                <View style={{ maxHeight: 160, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, marginBottom: 12, backgroundColor: '#fafafa' }}>
                  {selectedSvcName && (
                    <View style={{ backgroundColor: 'rgba(106,13,173,0.08)', padding: 8, borderRadius: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: PRIMARY, fontWeight: '500' }}>{selectedSvcName}</Text>
                    </View>
                  )}
                  <ScrollView>
                    {services.map(s => {
                      const sel = selectedServiceId === s.id;
                      return (
                        <TouchableOpacity key={s.id} onPress={() => setSelectedServiceId(s.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, backgroundColor: sel ? 'rgba(106,13,173,0.05)' : 'transparent', borderRadius: 8 }}>
                          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: sel ? PRIMARY : '#ccc', backgroundColor: sel ? PRIMARY : '#fff', marginRight: 10, justifyContent: 'center', alignItems: 'center' }}>
                            {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </View>
                          <Text style={{ flex: 1, fontSize: 13 }}>{s.title || 'Untitled'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 30 }}>
                <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginRight: 10 }}>
                  <Text style={{ color: '#666', fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} disabled={saving} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', opacity: saving ? 0.6 : 1 }}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Create</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: CARD_BG, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  addBtn: { backgroundColor: PRIMARY, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: CARD_BG, borderRadius: 12, marginBottom: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  code: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', letterSpacing: 1 },
  svcName: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardMid: { marginBottom: 10 },
  discount: { fontSize: 16, fontWeight: '600', color: PRIMARY, marginBottom: 4 },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  usageText: { fontSize: 12, color: '#888' },
  expiry: { fontSize: 12, color: '#888' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderRadius: 16, width: '88%', maxHeight: '92%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontWeight: 'bold', fontSize: 18, color: '#1a1a2e' },
  label: { fontSize: 12, color: '#888', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 10, fontSize: 14, backgroundColor: '#fafafa' },
  genBtn: { backgroundColor: PRIMARY, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
  scopeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', backgroundColor: '#fafafa', alignItems: 'center' },
  scopeBtnActive: { borderColor: PRIMARY, backgroundColor: 'rgba(106,13,173,0.06)' },
});

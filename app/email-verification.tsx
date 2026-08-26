import { useAuth } from '@/src/context/AuthContext';
import { getAuthErrorMessage } from '@/src/utils/authErrors';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailVerificationScreen() {
  const { user, loading, refreshUser, resendVerificationEmail, logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/auth');
    if (user?.isEmailVerified) router.replace('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRefresh = async () => {
    setBusy(true);
    const refreshedUser = await refreshUser();
    setBusy(false);
    if (refreshedUser?.isEmailVerified) {
      if (refreshedUser.role === 'admin') router.replace('/(admin)');
      else if (refreshedUser.role === 'artist') router.replace('/(artist)');
      else router.replace('/(client)');
    } else {
      Alert.alert('Not verified yet', 'Please open the link in your email, then try again.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    try {
      await resendVerificationEmail();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert('Email sent', 'Check your inbox and spam folder for the verification link.');
    } catch (error) {
      Alert.alert('Could not send email', getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  const handleChangeEmail = async () => {
    await logout();
    router.replace('/auth');
  };

  if (loading || !user || user.isEmailVerified) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>We sent a verification link to:</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.body}>Verify your email, then return here and tap the button below.</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleRefresh} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>I've verified my email</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleResend} disabled={busy || cooldown > 0}>
          <Text style={styles.secondaryText}>
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleChangeEmail} disabled={busy}>
          <Text style={styles.link}>Change email</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} disabled={busy}>
          <Text style={styles.link}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FB', justifyContent: 'center', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: '#fff', padding: 24, borderRadius: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 24, color: '#64748B', marginBottom: 8 },
  email: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 16 },
  primaryButton: { minHeight: 52, backgroundColor: '#6366F1', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
  link: { color: '#64748B', textAlign: 'center', paddingVertical: 10 },
});

// owo_flow/mobile/app/(tabs)/spend.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, shadows, borderRadius, spacing } from '@/constants';

const API_BASE = 'http://localhost:8000';

interface ExpenseSummary {
    business_burn: number;
    personal_spend: number;
    total_outflow: number;
    expense_count: number;
}

interface Expense {
    id: string;
    amount: number;
    description: string;
    category: string;
    expense_type: 'BUSINESS' | 'PERSONAL';
    date: string;
}

export default function SpendScreen() {
    const [mode, setMode] = useState<'BUSINESS' | 'PERSONAL'>('BUSINESS');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Operations');
    const [summary, setSummary] = useState<ExpenseSummary | null>(null);
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSummary();
        fetchExpenses();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${API_BASE}/expenses/summary`);
            const data = await res.json();
            setSummary(data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`${API_BASE}/expenses/list`);
            const data = await res.json();
            setRecentExpenses(data.slice(-5).reverse());
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    const handleLogExpense = async () => {
        if (!amount || !description) {
            alert('Please enter amount and description');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/expenses/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description,
                    category,
                    expense_type: mode,
                }),
            });

            if (res.ok) {
                setAmount('');
                setDescription('');
                fetchSummary();
                fetchExpenses();
            }
        } catch (error) {
            console.error('Error logging expense:', error);
            alert('Failed to log expense. Check if backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Animated.View entering={FadeInDown.springify()} style={styles.header}>
                <Text style={styles.greeting}>OwoFlow</Text>
                <Text style={styles.headerTitle}>Money Flow 💸</Text>
            </Animated.View>

            {/* Summary Cards */}
            <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.summaryContainer}>
                <View style={[styles.summaryCard, styles.bizCard]}>
                    <Ionicons name="briefcase" size={20} color="#00ff7f" />
                    <Text style={styles.summaryLabel}>Business</Text>
                    <Text style={[styles.summaryAmount, { color: '#00ff7f' }]}>
                        {formatNaira(summary?.business_burn || 0)}
                    </Text>
                </View>
                <View style={[styles.summaryCard, styles.persCard]}>
                    <Ionicons name="person" size={20} color="#ff00ff" />
                    <Text style={styles.summaryLabel}>Personal</Text>
                    <Text style={[styles.summaryAmount, { color: '#ff00ff' }]}>
                        {formatNaira(summary?.personal_spend || 0)}
                    </Text>
                </View>
            </Animated.View>

            {/* THE HYBRID SWITCH */}
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, mode === 'BUSINESS' && styles.activeBiz]}
                    onPress={() => setMode('BUSINESS')}>
                    <Ionicons name="briefcase" size={18} color={mode === 'BUSINESS' ? '#000' : '#888'} />
                    <Text style={[styles.toggleText, mode === 'BUSINESS' && styles.activeText]}> Business</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.toggleBtn, mode === 'PERSONAL' && styles.activePers]}
                    onPress={() => setMode('PERSONAL')}>
                    <Ionicons name="person" size={18} color={mode === 'PERSONAL' ? '#000' : '#888'} />
                    <Text style={[styles.toggleText, mode === 'PERSONAL' && styles.activeText]}> Personal</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* THE INPUT FORM */}
            <Animated.View
                entering={FadeInUp.delay(300).springify()}
                style={[styles.card, { borderColor: mode === 'BUSINESS' ? '#00ff7f' : '#ff00ff' }]}
            >
                <Text style={styles.label}>Amount (₦)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text style={styles.label}>What for?</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Diesel, Lunch, Data"
                    placeholderTextColor="#666"
                    value={description}
                    onChangeText={setDescription}
                />

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: mode === 'BUSINESS' ? '#00ff7f' : '#ff00ff' }]}
                    onPress={handleLogExpense}
                    disabled={loading}
                >
                    <Text style={styles.saveBtnText}>
                        {loading ? 'Logging...' : 'Log Expense'}
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* RECENT LOGS */}
            <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Recent Outflow</Text>
                {recentExpenses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📊</Text>
                        <Text style={styles.emptyText}>No expenses logged yet</Text>
                    </View>
                ) : (
                    recentExpenses.map((expense, index) => (
                        <View key={expense.id} style={styles.logItem}>
                            <View style={styles.logLeft}>
                                <View style={[
                                    styles.logTypeDot,
                                    { backgroundColor: expense.expense_type === 'BUSINESS' ? '#00ff7f' : '#ff00ff' }
                                ]} />
                                <View>
                                    <Text style={styles.logDesc}>{expense.description}</Text>
                                    <Text style={styles.logCategory}>{expense.category}</Text>
                                </View>
                            </View>
                            <Text style={[
                                styles.logAmount,
                                { color: expense.expense_type === 'BUSINESS' ? '#00ff7f' : '#ff00ff' }
                            ]}>
                                -{formatNaira(expense.amount)}
                            </Text>
                        </View>
                    ))
                )}
            </Animated.View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.DEFAULT,
        padding: spacing[4],
        paddingTop: spacing[12],
    },
    header: {
        marginBottom: spacing[4],
    },
    greeting: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: spacing[3],
        marginBottom: spacing[4],
    },
    summaryCard: {
        flex: 1,
        backgroundColor: Colors.dark.card,
        padding: spacing[4],
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        ...shadows.card,
    },
    bizCard: {
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 127, 0.3)',
    },
    persCard: {
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 255, 0.3)',
    },
    summaryLabel: {
        color: Colors.text.muted,
        fontSize: 12,
        marginTop: spacing[2],
    },
    summaryAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: spacing[1],
    },
    toggleContainer: {
        flexDirection: 'row',
        marginBottom: spacing[4],
        backgroundColor: Colors.dark.card,
        borderRadius: borderRadius.lg,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: borderRadius.DEFAULT,
    },
    activeBiz: { backgroundColor: '#00ff7f' },
    activePers: { backgroundColor: '#ff00ff' },
    toggleText: { fontWeight: '600', color: '#888', marginLeft: 8 },
    activeText: { color: '#000', fontWeight: 'bold' },
    card: {
        backgroundColor: Colors.dark.card,
        padding: spacing[5],
        borderRadius: borderRadius.xl,
        borderLeftWidth: 4,
        ...shadows.card,
    },
    label: {
        color: '#888',
        marginBottom: spacing[2],
        marginTop: spacing[3],
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: Colors.dark.DEFAULT,
        color: '#fff',
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        fontSize: 18,
        borderBottomWidth: 1,
        borderColor: Colors.dark.muted,
    },
    saveBtn: {
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        marginTop: spacing[6],
        alignItems: 'center',
        ...shadows.primary,
    },
    saveBtnText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 16,
    },
    recentSection: {
        marginTop: spacing[6],
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing[4],
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing[8],
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing[2],
    },
    emptyText: {
        color: Colors.text.muted,
        fontSize: 14,
    },
    logItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderColor: Colors.dark.muted,
    },
    logLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    logTypeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    logDesc: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    logCategory: {
        color: Colors.text.muted,
        fontSize: 12,
        marginTop: 2,
    },
    logAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

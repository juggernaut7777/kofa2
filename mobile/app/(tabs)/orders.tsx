import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, shadows, borderRadius, spacing } from '@/constants';
import { formatNaira, fetchOrders, Order } from '@/lib/api';

const AnimatedView = Animated.createAnimatedComponent(View);

function getStatusStyle(status: string): { color: string; bgColor: string; icon: string } {
    switch (status.toLowerCase()) {
        case 'paid':
            return {
                color: Colors.semantic.success,
                bgColor: 'rgba(16, 185, 129, 0.2)',
                icon: '✅'
            };
        case 'fulfilled':
            return {
                color: Colors.primary.DEFAULT,
                bgColor: 'rgba(0, 168, 89, 0.2)',
                icon: '📦'
            };
        case 'pending':
        default:
            return {
                color: Colors.semantic.warning,
                bgColor: 'rgba(245, 158, 11, 0.2)',
                icon: '⏳'
            };
    }
}

function maskPhone(phone: string): string {
    if (phone.length < 8) return phone;
    return phone.slice(0, 7) + '****' + phone.slice(-4);
}

function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
}

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await fetchOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error loading orders:", error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders().finally(() => setRefreshing(false));
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status.toLowerCase() === filter);

    // Stats
    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
    });
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const pendingCount = orders.filter(o => o.status.toLowerCase() === 'pending').length;

    const renderOrder = ({ item, index }: { item: Order; index: number }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <AnimatedView
                entering={FadeInUp.delay(index * 80).springify()}
                style={styles.orderCard}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.orderIcon}>📱</Text>
                        <View>
                            <Text style={styles.customerPhone}>
                                {maskPhone(item.customer_phone)}
                            </Text>
                            <Text style={styles.orderTime}>
                                {formatTime(new Date(item.created_at))}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
                        <Text style={styles.statusIcon}>{statusStyle.icon}</Text>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderItems}>
                    {item.items.map((orderItem: { product_id: string; product_name: string; quantity: number; price: number }, idx: number) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemQuantity}>{orderItem.quantity}x</Text>
                            <Text style={styles.itemName} numberOfLines={1}>
                                {orderItem.product_name}
                            </Text>
                            <Text style={styles.itemPrice}>
                                {formatNaira(orderItem.price * orderItem.quantity)}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>{formatNaira(item.total_amount)}</Text>
                </View>

                {item.status.toLowerCase() === 'pending' && (
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionButtonSecondary}>
                            <Text style={styles.actionTextSecondary}>❌ Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButtonPrimary}>
                            <Text style={styles.actionTextPrimary}>✅ Mark Paid</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {item.status.toLowerCase() === 'paid' && (
                    <TouchableOpacity style={styles.fulfillButton}>
                        <Text style={styles.fulfillButtonText}>📦 Mark as Fulfilled</Text>
                    </TouchableOpacity>
                )}
            </AnimatedView>
        );
    };

    const FilterButton = ({ label, value }: { label: string; value: string }) => (
        <TouchableOpacity
            style={[styles.filterButton, filter === value && styles.filterButtonActive]}
            onPress={() => setFilter(value)}
        >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <AnimatedView entering={FadeInDown.springify()} style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Merchant Dashboard</Text>
                    <Text style={styles.title}>Orders 📋</Text>
                </View>
            </AnimatedView>

            {/* Stats */}
            <AnimatedView entering={FadeInUp.delay(100).springify()} style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{todayOrders.length}</Text>
                    <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValueMoney}>{formatNaira(todayRevenue)}</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={[styles.statCard, pendingCount > 0 && styles.statCardWarning]}>
                    <Text style={[styles.statValue, pendingCount > 0 && styles.statValueWarning]}>
                        {pendingCount}
                    </Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </AnimatedView>

            {/* Filters */}
            <AnimatedView entering={FadeInUp.delay(150).springify()} style={styles.filtersRow}>
                <FilterButton label="All" value="all" />
                <FilterButton label="Pending" value="pending" />
                <FilterButton label="Paid" value="paid" />
                <FilterButton label="Fulfilled" value="fulfilled" />
            </AnimatedView>

            {/* Orders List */}
            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.orderList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary.DEFAULT}
                        colors={[Colors.primary.DEFAULT]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📭</Text>
                        <Text style={styles.emptyTitle}>No orders yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Orders from WhatsApp customers will appear here
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.DEFAULT,
    },
    header: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[12],
        paddingBottom: spacing[4],
    },
    greeting: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text.inverted,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing[4],
        marginBottom: spacing[4],
        gap: spacing[2],
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.dark.card,
        borderRadius: borderRadius.lg,
        padding: spacing[3],
        alignItems: 'center',
        ...shadows.sm,
    },
    statCardWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text.inverted,
    },
    statValueMoney: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.naira.text,
    },
    statValueWarning: {
        color: Colors.semantic.warning,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.text.muted,
        marginTop: 2,
    },
    filtersRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing[4],
        marginBottom: spacing[4],
        gap: spacing[2],
    },
    filterButton: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        backgroundColor: Colors.dark.card,
        borderRadius: borderRadius.lg,
    },
    filterButtonActive: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    filterText: {
        fontSize: 12,
        color: Colors.text.muted,
        fontWeight: '500',
    },
    filterTextActive: {
        color: Colors.text.inverted,
    },
    orderList: {
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[20],
    },
    orderCard: {
        backgroundColor: Colors.dark.card,
        borderRadius: borderRadius.xl,
        padding: spacing[4],
        marginBottom: spacing[3],
        ...shadows.card,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderIcon: {
        fontSize: 24,
        marginRight: spacing[2],
    },
    customerPhone: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.inverted,
    },
    orderTime: {
        fontSize: 11,
        color: Colors.text.muted,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.DEFAULT,
        gap: 4,
    },
    statusIcon: {
        fontSize: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    orderItems: {
        borderTopWidth: 1,
        borderTopColor: Colors.dark.muted,
        paddingTop: spacing[3],
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    itemQuantity: {
        fontSize: 12,
        color: Colors.text.muted,
        width: 30,
    },
    itemName: {
        flex: 1,
        fontSize: 14,
        color: Colors.text.inverted,
    },
    itemPrice: {
        fontSize: 13,
        color: Colors.text.muted,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing[2],
        paddingTop: spacing[2],
        borderTopWidth: 1,
        borderTopColor: Colors.dark.muted,
    },
    totalLabel: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.naira.text,
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: spacing[3],
        gap: spacing[2],
    },
    actionButtonSecondary: {
        flex: 1,
        backgroundColor: Colors.dark.muted,
        paddingVertical: spacing[2],
        borderRadius: borderRadius.DEFAULT,
        alignItems: 'center',
    },
    actionButtonPrimary: {
        flex: 2,
        backgroundColor: Colors.primary.DEFAULT,
        paddingVertical: spacing[2],
        borderRadius: borderRadius.DEFAULT,
        alignItems: 'center',
    },
    actionTextSecondary: {
        fontSize: 12,
        color: Colors.text.muted,
        fontWeight: '600',
    },
    actionTextPrimary: {
        fontSize: 12,
        color: Colors.text.inverted,
        fontWeight: '600',
    },
    fulfillButton: {
        marginTop: spacing[3],
        backgroundColor: Colors.primary.DEFAULT,
        paddingVertical: spacing[3],
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    fulfillButtonText: {
        fontSize: 14,
        color: Colors.text.inverted,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: spacing[16],
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing[4],
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.inverted,
        marginBottom: spacing[2],
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.text.muted,
        textAlign: 'center',
        paddingHorizontal: spacing[8],
    },
});

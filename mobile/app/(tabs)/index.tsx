import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, shadows, borderRadius, spacing } from '@/constants';
import { fetchProducts, formatNaira, Product } from '@/lib/api';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function getStockStatus(level: number): { color: string; label: string; bgColor: string } {
  if (level === 0) {
    return { color: Colors.semantic.error, label: 'Out of Stock', bgColor: 'rgba(239, 68, 68, 0.2)' };
  } else if (level <= 5) {
    return { color: Colors.semantic.error, label: 'Critical', bgColor: 'rgba(239, 68, 68, 0.2)' };
  } else if (level <= 15) {
    return { color: Colors.semantic.warning, label: 'Low Stock', bgColor: 'rgba(245, 158, 11, 0.2)' };
  }
  return { color: Colors.semantic.success, label: 'In Stock', bgColor: 'rgba(16, 185, 129, 0.2)' };
}

export default function InventoryScreen() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProducts().finally(() => setRefreshing(false));
  }, []);

  // Calculate stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock_level > 0 && p.stock_level <= 10).length;
  const outOfStockCount = products.filter(p => p.stock_level === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price_ngn * p.stock_level), 0);

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const stockStatus = getStockStatus(item.stock_level);

    return (
      <AnimatedTouchable
        entering={FadeInUp.delay(index * 80).springify()}
        style={styles.productCard}
        activeOpacity={0.9}
      >
        <View style={styles.productRow}>
          {/* Product Icon */}
          <View style={styles.productIcon}>
            <LinearGradient
              colors={[Colors.primary.light, Colors.primary.DEFAULT]}
              style={styles.iconGradient}
            >
              <Text style={styles.iconEmoji}>📦</Text>
            </LinearGradient>
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>{formatNaira(item.price_ngn)}</Text>
          </View>

          {/* Stock Badge */}
          <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
            <Text style={[styles.stockLevel, { color: stockStatus.color }]}>
              {item.stock_level}
            </Text>
            <Text style={[styles.stockLabel, { color: stockStatus.color }]}>
              {stockStatus.label}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>📊 + Restock</Text>
          </TouchableOpacity>
        </View>
      </AnimatedTouchable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AnimatedView entering={FadeInDown.springify()} style={styles.header}>
        <View>
          <Text style={styles.brandName}>OWOFLOW</Text>
          <Text style={styles.title}>Inventory 📦</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </AnimatedView>

      {/* Stats Cards */}
      <AnimatedView entering={FadeInUp.delay(100).springify()} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={[styles.statCard, lowStockCount > 0 && styles.statCardWarning]}>
          <Text style={[styles.statValue, lowStockCount > 0 && styles.statValueWarning]}>
            {lowStockCount}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={[styles.statCard, outOfStockCount > 0 && styles.statCardDanger]}>
          <Text style={[styles.statValue, outOfStockCount > 0 && styles.statValueDanger]}>
            {outOfStockCount}
          </Text>
          <Text style={styles.statLabel}>Out</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValueSmall}>{formatNaira(totalValue)}</Text>
          <Text style={styles.statLabel}>Value</Text>
        </View>
      </AnimatedView>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
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
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySubtitle}>Add your first product to get started</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
  },
  brandName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent.DEFAULT,
    letterSpacing: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.inverted,
  },
  addButton: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    ...shadows.primary,
  },
  addButtonText: {
    color: Colors.text.inverted,
    fontWeight: 'bold',
    fontSize: 14,
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
  statCardDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.inverted,
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.naira.text,
  },
  statValueWarning: {
    color: Colors.semantic.warning,
  },
  statValueDanger: {
    color: Colors.semantic.error,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text.muted,
    marginTop: 2,
  },
  productList: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[20],
  },
  productCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.card,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverted,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: Colors.naira.text,
    fontWeight: '500',
  },
  stockBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    minWidth: 70,
  },
  stockLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.dark.muted,
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.dark.muted,
    paddingVertical: spacing[2],
    borderRadius: borderRadius.DEFAULT,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: Colors.text.muted,
    fontWeight: '500',
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
  },
});

import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/Theme';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAuth, AccountType } from '@/context/AuthContext';

function TabBarIcon(props: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  const { color, focused, name } = props;
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      {focused ? (
        <LinearGradient
          colors={['rgba(43, 175, 242, 0.25)', 'rgba(31, 87, 245, 0.1)']}
          style={styles.focusedBackground}
        />
      ) : null}
      <Animated.View style={animatedStyle}>
        <Ionicons
          size={focused ? 24 : 22}
          color={focused ? '#2BAFF2' : color}
          name={name}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { accountType } = useAuth();

  // KOFA Vendor tabs
  const tabs = [
    {
      name: 'index',
      title: 'Inventory',
      icon: 'cube-outline',
      iconType: 'ionicons' as const,
    },
    {
      name: 'orders',
      title: 'Orders',
      icon: 'receipt-outline',
      iconType: 'ionicons' as const,
    },
    {
      name: 'analytics',
      title: 'Analytics',
      icon: 'bar-chart-outline',
      iconType: 'ionicons' as const,
    },
    {
      name: 'customers',
      title: 'Customers',
      icon: 'people-outline',
      iconType: 'ionicons' as const,
    },
    {
      name: 'spend',
      title: 'Expenses',
      icon: 'wallet-outline',
      iconType: 'ionicons' as const,
    },
    {
      name: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      iconType: 'ionicons' as const,
    },
  ];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2BAFF2',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <LinearGradient
              colors={['rgba(13, 17, 23, 0.98)', 'rgba(5, 9, 14, 1)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.tabBarBorder} />
          </View>
        ),
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={tab.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    height: 88,
    paddingTop: 12,
    paddingBottom: 24,
    elevation: 0,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tabBarBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
    color: Theme.colors.textSecondary,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.md,
    position: 'relative',
  },
  iconContainerFocused: {
    // Handled by gradient
  },
  focusedBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.borderRadius.md,
  },
});

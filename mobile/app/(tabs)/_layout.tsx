import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors, borderRadius, shadows } from '@/constants';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  const { color, focused, name } = props;
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <FontAwesome
        size={focused ? 24 : 22}
        color={focused ? Colors.primary.DEFAULT : color}
        name={name}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.DEFAULT,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="cubes" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="list-alt" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Bot Tester',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="comments" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="spend"
        options={{
          title: 'Spend',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="money" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.dark.card,
    borderTopWidth: 0,
    height: 80,
    paddingTop: 10,
    paddingBottom: 20,
    ...shadows.lg,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(0, 168, 89, 0.15)',
  },
});

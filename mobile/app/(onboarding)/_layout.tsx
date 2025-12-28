/**
 * Onboarding Layout - Stack for onboarding screens
 */
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="account-type" />
            <Stack.Screen name="business-setup" />
        </Stack>
    );
}

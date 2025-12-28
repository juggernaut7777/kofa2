/**
 * KOFA Account Type Selection - Choose Sales or Logistics
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ACCOUNT_TYPES = [
    {
        id: 'vendor',
        title: 'KOFA Vendor',
        subtitle: 'For small business owners and retailers',
        icon: 'storefront',
        iconType: 'ionicons',
        color: '#2BAFF2',
        features: [
            '📦 Inventory Management',
            '🤖 AI Sales Chatbot',
            '💰 Revenue & Profit Tracking',
            '📱 Social Media Integration',
        ],
        description: 'Perfect for fashion stores, electronics shops, beauty products, market vendors, and online sellers.'
    }
];

export default function AccountTypeSelection() {
    const [selectedType, setSelectedType] = useState(null);

    const handleContinue = () => {
        if (!selectedType) {
            Alert.alert('Account Type Required', 'Please select your account type to continue.');
            return;
        }

        // Store selected account type (will be used in business setup)
        // For now, just navigate to setup
        router.push({
            pathname: '/(onboarding)/business-setup',
            params: { accountType: selectedType }
        });
    };

    const renderAccountType = (type) => (
        <TouchableOpacity
            key={type.id}
            style={[
                styles.accountTypeCard,
                selectedType === type.id && styles.accountTypeCardSelected
            ]}
            onPress={() => setSelectedType(type.id)}
        >
            <LinearGradient
                colors={selectedType === type.id ?
                    [type.color, type.color + 'CC'] :
                    ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                }
                style={styles.accountTypeGradient}
            >
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: `${type.color}20` }]}>
                    {type.iconType === 'ionicons' ? (
                        <Ionicons name={type.icon} size={32} color={type.color} />
                    ) : (
                        <MaterialCommunityIcons name={type.icon} size={32} color={type.color} />
                    )}
                </View>

                {/* Content */}
                <View style={styles.accountTypeContent}>
                    <Text style={styles.accountTypeTitle}>{type.title}</Text>
                    <Text style={styles.accountTypeSubtitle}>{type.subtitle}</Text>

                    <Text style={styles.accountTypeDescription}>{type.description}</Text>

                    {/* Features */}
                    <View style={styles.featuresContainer}>
                        {type.features.map((feature, index) => (
                            <Text key={index} style={styles.featureText}>{feature}</Text>
                        ))}
                    </View>
                </View>

                {/* Selection Indicator */}
                {selectedType === type.id && (
                    <View style={styles.selectionIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color={type.color} />
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#05090E', '#0D1117', '#05090E']}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#2BAFF2', '#1F57F5']}
                        style={styles.headerIconBadge}
                    >
                        <Ionicons name="business" size={32} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.title}>Choose Your Account Type</Text>
                    <Text style={styles.subtitle}>
                        Select whether you're a seller/retailer or a logistics/delivery company
                    </Text>
                </View>

                {/* Account Type Selection */}
                <View style={styles.accountTypesContainer}>
                    {ACCOUNT_TYPES.map(renderAccountType)}
                </View>

                {/* Important Notice */}
                <View style={styles.noticeContainer}>
                    <Ionicons name="information-circle" size={20} color="#F59E0B" />
                    <Text style={styles.noticeText}>
                        <Text style={styles.noticeBold}>Important:</Text> You can create separate accounts for both sales and logistics operations, but you cannot switch account types within a single account.
                    </Text>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedType && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedType}
                >
                    <LinearGradient
                        colors={selectedType ? ['#2BAFF2', '#1F57F5'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                        style={styles.continueButtonGradient}
                    >
                        <Text style={[
                            styles.continueButtonText,
                            !selectedType && styles.continueButtonTextDisabled
                        ]}>
                            Continue
                        </Text>
                        <Ionicons
                            name="arrow-forward"
                            size={20}
                            color={selectedType ? "#FFF" : "rgba(255,255,255,0.3)"}
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

export default function OnboardingSetup() {
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { completeOnboarding } = useAuth();

    const handleComplete = async () => {
        if (!businessName.trim()) {
            Alert.alert('Missing Info', 'Please enter your business name');
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Save business info to backend
            // For now, just mark onboarding as complete
            await completeOnboarding();

            // Router will automatically redirect to (tabs) via _layout.tsx
        } catch (error) {
            Alert.alert('Error', 'Failed to save. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#05090E', '#0D1117', '#05090E']}
                style={StyleSheet.absoluteFillObject}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={['#2BAFF2', '#1F57F5']}
                            style={styles.iconBadge}
                        >
                            <Ionicons name="storefront" size={28} color="#FFF" />
                        </LinearGradient>
                        <Text style={styles.title}>Set Up Your Business</Text>
                        <Text style={styles.subtitle}>Tell us about your business to get started</Text>
                    </View>

                    {/* Business Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📍 Business Info</Text>

                        <Text style={styles.inputLabel}>Business Name *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Sarah's Fashion Hub"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={businessName}
                                onChangeText={setBusinessName}
                                textContentType="organizationName"
                                autoComplete="off"
                            />
                        </View>

                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="+234 XXX XXX XXXX"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                                autoComplete="tel"
                            />
                        </View>

                        <Text style={styles.inputLabel}>Business Address</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Your shop or delivery address"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={address}
                                onChangeText={setAddress}
                                textContentType="streetAddressLine1"
                                autoComplete="street-address"
                            />
                        </View>
                    </View>

                    {/* Complete Button */}
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={handleComplete}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#2BAFF2', '#1F57F5']}
                            style={styles.completeButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.completeButtonText}>Complete Setup</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.skipHint}>You can update these later in Settings</Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05090E',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    sectionHint: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
        marginTop: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        height: 54,
        justifyContent: 'center',
    },
    input: {
        height: 54,
        paddingVertical: 0,
        paddingHorizontal: 16,
        color: '#FFFFFF',
        fontSize: 15,
    },
    completeButton: {
        marginTop: 24,
        borderRadius: 14,
        overflow: 'hidden',
    },
    completeButtonGradient: {
        flexDirection: 'row',
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    completeButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    skipHint: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        marginTop: 16,
    },
    accountTypesContainer: {
        gap: 20,
        marginBottom: 24,
    },
    accountTypeCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    accountTypeCardSelected: {
        borderColor: '#2BAFF2',
        shadowColor: '#2BAFF2',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    accountTypeGradient: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    accountTypeContent: {
        flex: 1,
    },
    accountTypeTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    accountTypeSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 12,
    },
    accountTypeDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 18,
        marginBottom: 16,
    },
    featuresContainer: {
        gap: 6,
    },
    featureText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    selectionIndicator: {
        marginLeft: 12,
    },
    noticeContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    noticeText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 18,
        marginLeft: 12,
        flex: 1,
    },
    noticeBold: {
        fontWeight: '700',
        color: '#F59E0B',
    },
    continueButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonGradient: {
        flexDirection: 'row',
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    continueButtonTextDisabled: {
        color: 'rgba(255,255,255,0.5)',
    },
});

/**
 * KOFA Business Setup - Account-specific setup based on account type
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const BUSINESS_CONFIG = {
    title: 'Set Up Your KOFA Business',
    subtitle: 'Configure your business details to start selling with AI',
    icon: 'storefront',
    fields: [
        { key: 'businessName', label: 'Business Name *', placeholder: "e.g. Sarah's Fashion Hub", required: true },
        { key: 'phone', label: 'Phone Number', placeholder: '+234 XXX XXX XXXX', keyboardType: 'phone-pad' },
        { key: 'address', label: 'Business Address', placeholder: 'Your shop or office address' },
        { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. GTBank, First Bank' },
        { key: 'accountNumber', label: 'Account Number', placeholder: '10-digit account number' },
        { key: 'accountName', label: 'Account Name', placeholder: 'Account holder name' },
    ],
    features: [
        '📦 Smart inventory management',
        '🤖 AI chatbot for 24/7 sales',
        '📱 WhatsApp/Instagram/TikTok integration',
        '📊 Sales & profit analytics'
    ]
};

export default function BusinessSetup() {
    const { accountType } = useLocalSearchParams();
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { completeOnboarding } = useAuth();

    const config = BUSINESS_CONFIG;

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const validateForm = () => {
        for (const field of config.fields) {
            if (field.required && !formData[field.key]?.trim()) {
                Alert.alert('Missing Info', `${field.label.replace(' *', '')} is required`);
                return false;
            }
        }
        return true;
    };

    const handleComplete = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // Save account type and business info
            const businessData = {
                accountType,
                ...formData,
                setupCompleted: true,
                setupDate: new Date().toISOString()
            };

            // TODO: Save to backend
            console.log('Business setup data:', businessData);

            await completeOnboarding(businessData);

            // Router will automatically redirect based on account type
        } catch (error) {
            Alert.alert('Error', 'Failed to save business info. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderField = (field) => (
        <View key={field.key}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={formData[field.key] || ''}
                    onChangeText={(value) => updateField(field.key, value)}
                    keyboardType={field.keyboardType || 'default'}
                    textContentType={field.key === 'phone' ? 'telephoneNumber' :
                                   field.key === 'email' ? 'emailAddress' : 'none'}
                    autoComplete={field.key === 'phone' ? 'tel' :
                                field.key === 'email' ? 'email' : 'off'}
                />
            </View>
        </View>
    );

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
                            <Ionicons name={config.icon} size={28} color="#FFF" />
                        </LinearGradient>
                        <Text style={styles.title}>{config.title}</Text>
                        <Text style={styles.subtitle}>{config.subtitle}</Text>

                        {/* Features Preview */}
                        <View style={styles.featuresPreview}>
                            <Text style={styles.featuresTitle}>What you'll get:</Text>
                            {config.features.map((feature, index) => (
                                <Text key={index} style={styles.featureItem}>{feature}</Text>
                            ))}
                        </View>
                    </View>

                    {/* Business Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Business Details</Text>

                        {config.fields.map(renderField)}
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
                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.skipHint}>
                        You can update these details later in Settings
                    </Text>
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
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 20,
    },
    featuresPreview: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        width: '100%',
    },
    featuresTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    featureItem: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
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
});



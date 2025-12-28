/**
 * KOFA Onboarding Welcome - Carousel of welcome slides
 */
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        emoji: '⚡',
        title: 'Welcome to KOFA',
        subtitle: 'Your AI-powered commerce engine for modern merchants',
        color: '#2BAFF2',
    },
    {
        id: '2',
        emoji: '📦',
        title: 'Manage Inventory',
        subtitle: 'Track products, stock levels, and categories with ease',
        color: '#22C55E',
    },
    {
        id: '3',
        emoji: '💬',
        title: 'AI Sales Bot',
        subtitle: 'Automated customer support on WhatsApp, Instagram & TikTok',
        color: '#E130A5',
    },
    {
        id: '4',
        emoji: '📊',
        title: 'Track Everything',
        subtitle: 'Sales analytics, expenses, and profit reports at your fingertips',
        color: '#F59E0B',
    },
];

export default function OnboardingWelcome() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
            setCurrentIndex(currentIndex + 1);
        } else {
            router.push('/(onboarding)/account-type');
        }
    };

    const handleSkip = () => {
        router.push('/(onboarding)/setup');
    };

    const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
        <View style={styles.slide}>
            <Animated.View entering={FadeIn.delay(200)} style={[styles.emojiContainer, { backgroundColor: `${item.color}20` }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(300)} style={styles.slideTitle}>
                {item.title}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400)} style={styles.slideSubtitle}>
                {item.subtitle}
            </Animated.Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#05090E', '#0D1117', '#05090E']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                contentContainerStyle={styles.slideList}
            />

            {/* Dots & Button */}
            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.dots}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Next/Get Started Button */}
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                        colors={['#2BAFF2', '#1F57F5']}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05090E',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
        fontWeight: '600',
    },
    slideList: {
        paddingTop: 100,
    },
    slide: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emojiContainer: {
        width: 120,
        height: 120,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 56,
    },
    slideTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    slideSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 50,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        width: 24,
        backgroundColor: '#2BAFF2',
    },
    nextButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    nextButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});

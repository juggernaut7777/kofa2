import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { Colors, shadows, borderRadius, spacing } from '@/constants';
import { sendMessage, ChatMessage, formatNaira } from '@/lib/api';

const AnimatedView = Animated.createAnimatedComponent(View);

// Generate unique user ID (in production, use device ID or auth)
const USER_ID = '+234' + Math.random().toString().slice(2, 12);

export default function ChatScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: 'Wetin dey happen! 🎉 Welcome to Owo Flow!\n\nI go help you find the beta products for the best price.\n\nWetin you dey find today?',
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await sendMessage(USER_ID, inputText.trim());

            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: response.response,
                isUser: false,
                timestamp: new Date(),
                product: response.product,
                paymentLink: response.payment_link,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            // Demo mode - simulate response when backend is not running
            const demoResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: getDemoResponse(inputText.trim()),
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, demoResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    const getDemoResponse = (input: string): string => {
        const lower = input.toLowerCase();
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            return 'How far! 👋 Wetin I fit help you with today? We get plenty fine items for sale!';
        }
        if (lower.includes('sneaker') || lower.includes('shoe')) {
            return 'Ah! We get the Premium Red Sneakers for ₦45,000! 👟\n\nE dey very fresh, only 12 remain o. You wan buy?';
        }
        if (lower.includes('buy') || lower.includes('purchase')) {
            return 'Sharp sharp! 💳 Make I send you the payment link?\n\nJust confirm which item you wan buy and I go sort you out.';
        }
        if (lower.includes('price') || lower.includes('how much')) {
            return 'Our prices dey very correct! 💰\n\n• Sneakers: ₦45,000\n• Beach Shorts: ₦8,500\n• Ankara Shirt: ₦15,000\n\nWhich one you dey eye?';
        }
        return 'I hear you! 🙏 Just tell me wetin you wan find or check the Products tab to see our full catalog.';
    };

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => (
        <AnimatedView
            entering={item.isUser ? SlideInRight.springify() : SlideInLeft.springify()}
            style={[
                styles.messageContainer,
                item.isUser ? styles.userMessageContainer : styles.botMessageContainer,
            ]}
        >
            {!item.isUser && (
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>🤖</Text>
                </View>
            )}
            <View
                style={[
                    styles.messageBubble,
                    item.isUser ? styles.userBubble : styles.botBubble,
                ]}
            >
                <Text style={[styles.messageText, item.isUser && styles.userMessageText]}>
                    {item.text}
                </Text>

                {item.product && (
                    <View style={styles.productCard}>
                        <Text style={styles.productName}>{item.product.name}</Text>
                        <Text style={styles.productPrice}>
                            {formatNaira(item.product.price_ngn)}
                        </Text>
                    </View>
                )}

                {item.paymentLink && (
                    <TouchableOpacity style={styles.payButton}>
                        <Text style={styles.payButtonText}>💳 Pay Now</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.timestamp}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </AnimatedView>
    );

    useEffect(() => {
        // Scroll to bottom when new message arrives
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <AnimatedView entering={FadeInDown.springify()} style={styles.header}>
                <View style={styles.headerAvatar}>
                    <Text style={styles.headerAvatarText}>🤖</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Bot Tester</Text>
                    <Text style={styles.headerStatus}>
                        {isLoading ? 'Typing...' : 'Test how your bot responds'}
                    </Text>
                </View>
            </AnimatedView>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
            />

            {/* Input */}
            <AnimatedView entering={FadeInUp.springify()} style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your message..."
                    placeholderTextColor={Colors.text.muted}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    editable={!isLoading}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={Colors.text.inverted} size="small" />
                    ) : (
                        <Text style={styles.sendButtonText}>➤</Text>
                    )}
                </TouchableOpacity>
            </AnimatedView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.DEFAULT,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingTop: spacing[12],
        paddingBottom: spacing[3],
        backgroundColor: Colors.dark.card,
        ...shadows.md,
    },
    headerAvatar: {
        width: 48,
        height: 48,
        backgroundColor: Colors.primary.DEFAULT,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[3],
    },
    headerAvatarText: {
        fontSize: 24,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.inverted,
    },
    headerStatus: {
        fontSize: 12,
        color: Colors.text.muted,
        marginTop: 2,
    },
    messageList: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
        paddingBottom: spacing[4],
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: spacing[4],
        alignItems: 'flex-end',
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    botMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        backgroundColor: Colors.dark.muted,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[2],
    },
    avatarText: {
        fontSize: 16,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: spacing[3],
        borderRadius: borderRadius.xl,
    },
    userBubble: {
        backgroundColor: Colors.primary.DEFAULT,
        borderBottomRightRadius: spacing[1],
    },
    botBubble: {
        backgroundColor: Colors.dark.card,
        borderBottomLeftRadius: spacing[1],
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text.inverted,
    },
    userMessageText: {
        color: Colors.text.inverted,
    },
    timestamp: {
        fontSize: 10,
        color: Colors.text.muted,
        marginTop: spacing[1],
        textAlign: 'right',
    },
    productCard: {
        backgroundColor: Colors.dark.muted,
        padding: spacing[3],
        borderRadius: borderRadius.lg,
        marginTop: spacing[2],
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.inverted,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.naira.text,
        marginTop: spacing[1],
    },
    payButton: {
        backgroundColor: Colors.accent.DEFAULT,
        padding: spacing[3],
        borderRadius: borderRadius.lg,
        marginTop: spacing[2],
        alignItems: 'center',
    },
    payButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.DEFAULT,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing[4],
        backgroundColor: Colors.dark.card,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.muted,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.dark.muted,
        borderRadius: borderRadius['2xl'],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: 16,
        color: Colors.text.inverted,
        marginRight: spacing[3],
    },
    sendButton: {
        width: 48,
        height: 48,
        backgroundColor: Colors.primary.DEFAULT,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.primary,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.dark.muted,
        ...shadows.sm,
    },
    sendButtonText: {
        fontSize: 20,
        color: Colors.text.inverted,
    },
});

/**
 * Owo Flow API Client
 * Connects to the FastAPI backend
 */

// API Base URL - Change this to your computer's local IP for testing
// Find your IP: Open CMD and run 'ipconfig' -> look for IPv4 Address
const API_BASE_URL = 'http://192.168.1.100:8000';  // << UPDATE THIS!

export interface Product {
    id: string;
    name: string;
    price_ngn: number;
    stock_level: number;
    description?: string;
    image_url?: string;
    voice_tags?: string[];
}

export interface MessageResponse {
    response: string;
    intent: string;
    product?: Product;
    payment_link?: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    product?: Product;
    paymentLink?: string;
}

/**
 * Format price in Nigerian Naira
 */
export function formatNaira(amount: number): string {
    return `₦${amount.toLocaleString('en-NG')}`;
}

/**
 * Send a message to the chatbot
 */
export async function sendMessage(
    userId: string,
    messageText: string
): Promise<MessageResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                message_text: messageText,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get products from backend
 */
export async function fetchProducts(): Promise<Product[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('Failed to fetch products from API, falling back to mock data:', error);
        return getMockProducts();
    }
}

/**
 * Get mock products for demo (fallback)
 */
export function getMockProducts(): Product[] {
    return [
        {
            id: '1',
            name: 'Premium Red Sneakers',
            price_ngn: 45000,
            stock_level: 12,
            description: 'Fresh kicks for the street',
            voice_tags: ['sneakers', 'red shoe', 'kicks'],
        },
        {
            id: '2',
            name: 'Lagos Beach Shorts',
            price_ngn: 8500,
            stock_level: 25,
            description: 'Perfect for that Elegushi flex',
            voice_tags: ['shorts', 'beach wear', 'summer'],
        },
        {
            id: '3',
            name: 'Ankara Print Shirt',
            price_ngn: 15000,
            stock_level: 8,
            description: 'Traditional meets modern',
            voice_tags: ['ankara', 'shirt', 'native'],
        },
        {
            id: '4',
            name: 'Designer Sunglasses',
            price_ngn: 22000,
            stock_level: 15,
            description: 'Block out Lagos sun in style',
            voice_tags: ['shades', 'glasses', 'sunglasses'],
        },
        {
            id: '5',
            name: 'Gold Chain Necklace',
            price_ngn: 85000,
            stock_level: 5,
            description: 'Shine like Burna Boy',
            voice_tags: ['chain', 'jewelry', 'gold'],
        },
        {
            id: '6',
            name: 'Leather Wallet',
            price_ngn: 12000,
            stock_level: 20,
            description: 'Keep your Naira secure',
            voice_tags: ['wallet', 'leather', 'purse'],
        },
    ];
}

export interface OrderItemDetail {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    customer_phone: string;
    items: OrderItemDetail[];
    total_amount: number;
    status: 'pending' | 'paid' | 'fulfilled';
    payment_ref?: string;
    created_at: string;
}

export interface OrderItem {
    product_id: string;
    quantity: number;
}

export interface CreateOrderResponse {
    order_id: string;
    payment_link: string;
    amount_ngn: number;
    message: string;
}

/**
 * Create a new order
 */
export async function createOrder(items: OrderItem[], userId: string = "default_user"): Promise<CreateOrderResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items,
                user_id: userId,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Create Order Error:', error);
        throw error;
    }
}

/**
 * Fetch orders from backend (for merchant dashboard)
 */
export async function fetchOrders(status?: string): Promise<Order[]> {
    try {
        const url = status
            ? `${API_BASE_URL}/orders?status=${status}`
            : `${API_BASE_URL}/orders`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('Failed to fetch orders from API, returning mock data:', error);
        return getMockOrders();
    }
}

/**
 * Mock orders for demo
 */
export function getMockOrders(): Order[] {
    return [
        {
            id: 'order-001',
            customer_phone: '+2348012345678',
            items: [
                { product_id: '1', product_name: 'Nike Air Max Red', quantity: 1, price: 45000 },
            ],
            total_amount: 45000,
            status: 'pending',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        },
        {
            id: 'order-002',
            customer_phone: '+2349087654321',
            items: [
                { product_id: '3', product_name: 'Men Formal Shirt White', quantity: 2, price: 15000 },
                { product_id: '6', product_name: 'Plain Round Neck T-Shirt', quantity: 3, price: 8000 },
            ],
            total_amount: 54000,
            status: 'paid',
            payment_ref: 'PAY-ABC123',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
            id: 'order-003',
            customer_phone: '+2348055551234',
            items: [
                { product_id: '5', product_name: 'Black Leather Bag', quantity: 1, price: 35000 },
            ],
            total_amount: 35000,
            status: 'fulfilled',
            payment_ref: 'PAY-XYZ789',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
        },
    ];
}

export default {
    sendMessage,
    checkHealth,
    fetchProducts,
    fetchOrders,
    createOrder,
    formatNaira,
    getMockProducts,
    getMockOrders,
    API_BASE_URL,
};

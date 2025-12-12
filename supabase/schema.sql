
-- Create indexes for orders
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_ref ON orders(payment_ref);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (Nigerian market optimized)
INSERT INTO products (name, price_ngn, stock_level, voice_tags, description, category) VALUES
    (
        'Nike Air Max Red',
        45000,
        4,
        ARRAY[
            'red canvas', 'red sneakers', 'canvas', 'kicks', 'gym shoes', 'running shoes',
            'red kicks', 'sport shoe', 'nike red', 'air max', 'the red one', 'red trainer',
            'joggers', 'red joggers', 'red shoe', 'fitness shoe'
        ],
        'Premium Nike Air Max running shoes in red',
        'Footwear'
    ),
    (
        'Adidas White Sneakers',
        38000,
        10,
        ARRAY[
            'white canvas', 'canvas', 'white sneakers', 'white kicks', 'adidas white',
            'clean white', 'all white', 'white shoe', 'joggers', 'white joggers',
            'sport shoe', 'gym shoe', 'trainer', 'white trainer'
        ],
        'Classic white Adidas sneakers',
        'Footwear'
    ),
    (
        'Men Formal Shirt White',
        15000,
        20,
        ARRAY[
            'packing shirt', 'button down', 'office wear', 'white shirt', 'formal shirt',
            'top', 'office top', 'work shirt', 'cooperate shirt', 'long sleeve',
            'shirt for work', 'clean shirt', 'official shirt'
        ],
        'Professional white formal shirt for office',
        'Clothing'
    ),
    (
        'Designer Blue Jeans',
        25000,
        15,
        ARRAY[
            'jeans', 'blue jeans', 'denim', 'trouser', 'jean trouser', 'pants',
            'blue trouser', 'designer jeans', 'quality jeans', 'blue pants',
            'denim trouser', 'jean pant'
        ],
        'Premium designer blue denim jeans',
        'Clothing'
    ),
    (
        'Black Leather Bag',
        35000,
        5,
        ARRAY[
            'bag', 'leather bag', 'handbag', 'black bag', 'purse', 'side bag',
            'hand bag', 'designer bag', 'quality bag', 'big bag', 'leather purse',
            'black purse', 'big black bag', 'the black bag'
        ],
        'Premium black leather handbag',
        'Accessories'
    ),
    (
        'Plain Round Neck T-Shirt',
        8000,
        50,
        ARRAY[
            'round neck', 'polo', 'top', 'plain tee', 't-shirt', 'tshirt',
            'plain top', 'round neck top', 'casual top', 'plain shirt',
            'normal top', 'simple top', 'everyday top'
        ],
        'Comfortable plain t-shirt for casual wear',
        'Clothing'
    ),
    (
        'iPhone Charger Fast Charging',
        12000,
        30,
        ARRAY[
            'charger', 'iphone charger', 'charging cable', 'cable', 'fast charger',
            'phone charger', 'lightning cable', 'charging wire', 'wire',
            'iphone wire', 'usb cable', 'data cable'
        ],
        'Fast charging cable for iPhone',
        'Electronics'
    );

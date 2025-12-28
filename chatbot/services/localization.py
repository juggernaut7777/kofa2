"""
KOFA Multi-Language Localization Service
Supports English, Nigerian Pidgin, Hausa, Igbo, and Yoruba for national expansion.
"""
from typing import Dict, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Language(str, Enum):
    """Supported languages."""
    ENGLISH = "en"
    PIDGIN = "pid"
    HAUSA = "ha"
    IGBO = "ig"
    YORUBA = "yo"


# Language detection keywords
LANGUAGE_KEYWORDS = {
    Language.PIDGIN: [
        "wetin", "abeg", "dey", "no be", "wahala", "how far", "shey", 
        "una", "dem", "na", "e be", "i wan", "make i", "no vex", 
        "abi", "sha", "jare", "oya", "comot", "wey", "sabi"
    ],
    Language.HAUSA: [
        "sannu", "yaya", "lafiya", "nagode", "ina", "kuna", "muna",
        "wannan", "yau", "gobe", "jiya", "nawa", "kai", "kin", "sun"
    ],
    Language.IGBO: [
        "kedu", "nnọọ", "daalu", "biko", "ndewo", "ọdịnma", 
        "gịnị", "achọrọ", "ego", "ọnụahịa", "zụta", "ire"
    ],
    Language.YORUBA: [
        "bawo", "ṣe", "daadaa", "kini", "ekaaro", "ekasan", "ekaale",
        "owo", "melo", "fẹ", "ra", "ta", "jọwọ", "ese", "pẹlẹ"
    ]
}


# Translation dictionary for common phrases
TRANSLATIONS: Dict[str, Dict[Language, str]] = {
    # Greetings
    "greeting": {
        Language.ENGLISH: "Hello! Welcome to {store_name}. How can I help you today?",
        Language.PIDGIN: "How far! Welcome to {store_name}. Wetin you wan buy today?",
        Language.HAUSA: "Sannu! Maraba da kai a {store_name}. Yaya zan taimaka maka yau?",
        Language.IGBO: "Nnọọ! Nnabata na {store_name}. Kedụ ka m ga-esi nyere gị aka taa?",
        Language.YORUBA: "Pẹlẹ o! Kaabọ si {store_name}. Báwo ni mo ṣe le ràn ọ́ lọ́wọ́ lónìí?"
    },
    
    # Help message
    "help": {
        Language.ENGLISH: "You can:\n• Browse products - just describe what you want\n• Check prices - ask 'how much is...'\n• Place orders - I'll send you a payment link\n• Check order status - ask about your order",
        Language.PIDGIN: "You fit:\n• Check products - just describe wetin you wan\n• Ask price - 'how much be...'\n• Order am - I go send you payment link\n• Check your order - ask me about am",
        Language.HAUSA: "Za ka iya:\n• Duba kayayyaki - kawai bayyana abin da kake so\n• Nemi farashi - 'nawa ne...'\n• Yin oda - Zan aika maka hanyar biyan kuɗi\n• Duba yanayin oda - ka tambaye ni",
        Language.IGBO: "Ị nwere ike:\n• Lelee ngwaahịa - kọwaa ihe ị chọrọ\n• Jụọ ọnụahịa - 'ego ole bu...'\n• Tinye order - M ga-ezitere gị njikọ ịkwụ ụgwọ\n• Lelee ọnọdụ order - jụọ m",
        Language.YORUBA: "O le:\n• Wo ọja - ṣapejuwe ohun ti o fẹ\n• Bi iye owo - 'melo ni...'\n• Fi order silẹ - Emi yoo fi ọna san owo ranṣẹ\n• Ṣayẹwo ipo order - beere lọwọ mi"
    },
    
    # Product found
    "product_found": {
        Language.ENGLISH: "I found {product_name}!\n💰 Price: ₦{price:,}\n📦 Stock: {stock} available\n\nWould you like to order?",
        Language.PIDGIN: "I don find {product_name}!\n💰 Price: ₦{price:,}\n📦 Stock: {stock} dey\n\nYou wan order am?",
        Language.HAUSA: "Na sami {product_name}!\n💰 Farashi: ₦{price:,}\n📦 Kaya: {stock} akwai\n\nKana so ka oda?",
        Language.IGBO: "Achọtara m {product_name}!\n💰 Ọnụahịa: ₦{price:,}\n📦 Stock: {stock} dị\n\nỊ chọrọ ịnye order?",
        Language.YORUBA: "Mo ti ri {product_name}!\n💰 Iye: ₦{price:,}\n📦 Ẹru: {stock} wa\n\nṢe o fẹ ra?"
    },
    
    # Product not found
    "product_not_found": {
        Language.ENGLISH: "Sorry, I couldn't find that product. Can you describe it differently?",
        Language.PIDGIN: "Omo sorry, I no see that product. Abeg describe am another way?",
        Language.HAUSA: "Yi haƙuri, ban sami wannan kaya ba. Ko za ka iya bayyana shi ta wata hanya?",
        Language.IGBO: "Ndo, achọtaghị m ngwaahịa ahụ. Ị nwere ike ịkọwa ya n'ụzọ ọzọ?",
        Language.YORUBA: "Ma binu, mi o ri ọja yẹn. Ṣe o le ṣapejuwe rẹ ni ọna miiran?"
    },
    
    # Out of stock
    "out_of_stock": {
        Language.ENGLISH: "Sorry, {product_name} is currently out of stock. Check back soon!",
        Language.PIDGIN: "Sorry o, {product_name} don finish. Check back later!",
        Language.HAUSA: "Yi haƙuri, {product_name} ya ƙare yanzu. Ka duba nan gaba!",
        Language.IGBO: "Ndo, {product_name} agwụla ugbu a. Lelee ọzọ n'oge adịghị anya!",
        Language.YORUBA: "Ma binu, {product_name} ti pari bayi. Ṣayẹwo lẹẹkansi laipẹ!"
    },
    
    # Order confirmation
    "order_created": {
        Language.ENGLISH: "Great! Your order for {product_name} is ready.\n\n💳 Total: ₦{total:,}\n\nClick here to pay: {payment_link}\n\nOrder ID: {order_id}",
        Language.PIDGIN: "Correct! Your order for {product_name} don ready.\n\n💳 Total: ₦{total:,}\n\nClick here pay: {payment_link}\n\nOrder ID: {order_id}",
        Language.HAUSA: "Lafiya! Odar ku ta {product_name} ta shirya.\n\n💳 Jimlar: ₦{total:,}\n\nDanna nan don biyan kuɗi: {payment_link}\n\nOda ID: {order_id}",
        Language.IGBO: "Ọ dị mma! Order gị nke {product_name} dị njikere.\n\n💳 Nchịkọta: ₦{total:,}\n\nPịa ebe a ịkwụ ụgwọ: {payment_link}\n\nOrder ID: {order_id}",
        Language.YORUBA: "O dara! Aṣẹ rẹ fun {product_name} ti ṣetan.\n\n💳 Àpapọ̀: ₦{total:,}\n\nTẹ ibi lati san: {payment_link}\n\nOrder ID: {order_id}"
    },
    
    # Payment received
    "payment_received": {
        Language.ENGLISH: "🎉 Payment received! Thank you for your order.\n\nWe'll prepare your {product_name} for delivery.\n\nOrder ID: {order_id}",
        Language.PIDGIN: "🎉 Money don enter! Thank you for your order.\n\nWe go prepare your {product_name} for delivery.\n\nOrder ID: {order_id}",
        Language.HAUSA: "🎉 An karɓi kuɗi! Mun gode da odarku.\n\nZa mu shirya {product_name} don aikawa.\n\nOda ID: {order_id}",
        Language.IGBO: "🎉 Ego abatala! Daalụ maka order gị.\n\nAnyị ga-akwadebe {product_name} gị maka nnyefe.\n\nOrder ID: {order_id}",
        Language.YORUBA: "🎉 A ti gba owo! O ṣeun fun aṣẹ rẹ.\n\nA yoo pese {product_name} rẹ fun ifijiṣẹ.\n\nOrder ID: {order_id}"
    },
    
    # Low stock warning (for vendor)
    "low_stock_warning": {
        Language.ENGLISH: "⚠️ Low stock alert!\n{product_name} has only {stock} left.",
        Language.PIDGIN: "⚠️ Stock dey low!\n{product_name} remain only {stock}.",
        Language.HAUSA: "⚠️ Gargaɗin ƙarancin kaya!\n{product_name} ya rage kawai {stock}.",
        Language.IGBO: "⚠️ Ịdọ aka ná ntị na stock dị ala!\n{product_name} fọdụrụ naanị {stock}.",
        Language.YORUBA: "⚠️ Ìkìlọ̀ ẹru kekere!\n{product_name} ku nikan {stock}."
    },
    
    # Voice consent request
    "voice_consent": {
        Language.ENGLISH: "I noticed you sent a voice note. Can I transcribe it to understand your order? Reply YES to agree.",
        Language.PIDGIN: "I see say you send voice note. Make I change am to text so I fit understand wetin you wan? Reply YES if e dey okay.",
        Language.HAUSA: "Na lura ka aika saƙon murya. Zan iya canza shi zuwa rubutu don in fahimci odar ku? Amsa EE don yarda.",
        Language.IGBO: "Ahụrụ m na ị zitere ozi olu. Enwere m ike ịdekọ ya ka m ghọta order gị? Zaa EE ịkwenye.",
        Language.YORUBA: "Mo rii pe o fi ifiranṣẹ ohùn ranṣẹ. Ṣe mo le yi pada si ọrọ lati ye aṣẹ rẹ? Dahun BEENI lati gba."
    },
    
    # Thank you
    "thank_you": {
        Language.ENGLISH: "Thank you! Is there anything else you'd like?",
        Language.PIDGIN: "Thank you o! Anything else you wan?",
        Language.HAUSA: "Mun gode! Akwai wani abu kuma da kuke so?",
        Language.IGBO: "Daalụ! Ọ dị ihe ọzọ ị chọrọ?",
        Language.YORUBA: "O ṣeun! Ṣe ohun miiran wa ti o fẹ?"
    },
    
    # Goodbye
    "goodbye": {
        Language.ENGLISH: "Thank you for shopping with us! See you soon! 👋",
        Language.PIDGIN: "Thank you say you patronize us! We go see later! 👋",
        Language.HAUSA: "Mun gode da sayan ku! Sai an jima! 👋",
        Language.IGBO: "Daalụ maka ịzụ ahịa anyị! Ka ọ dị! 👋",
        Language.YORUBA: "O ṣeun fun rira lọdọ wa! A o ri ẹ laipẹ! 👋"
    },
    
    # Error/Unknown
    "unknown": {
        Language.ENGLISH: "I'm not sure I understood that. Could you try again?",
        Language.PIDGIN: "I no too understand wetin you talk. Abeg try again?",
        Language.HAUSA: "Ban tabbata na fahimci hakan ba. Za ku iya sake gwadawa?",
        Language.IGBO: "Amaghị m ihe ị kwuru. Ị nwere ike ịnwa ọzọ?",
        Language.YORUBA: "Mi o ni idaniloju pe mo ye ohun ti o sọ. Ṣe o le gbiyanju lẹẹkansi?"
    },
    
    # Price inquiry
    "price_inquiry": {
        Language.ENGLISH: "The price of {product_name} is ₦{price:,}",
        Language.PIDGIN: "{product_name} na ₦{price:,}",
        Language.HAUSA: "Farashin {product_name} shine ₦{price:,}",
        Language.IGBO: "Ọnụahịa nke {product_name} bụ ₦{price:,}",
        Language.YORUBA: "Iye {product_name} jẹ ₦{price:,}"
    }
}


class LocalizationService:
    """
    Multi-language support for KOFA chatbot.
    Supports Nigerian English, Pidgin, Hausa, Igbo, and Yoruba.
    """
    
    def __init__(self):
        self.default_language = Language.ENGLISH
        # Store user language preferences
        self._user_languages: Dict[str, Language] = {}
    
    def detect_language(self, text: str) -> Language:
        """
        Auto-detect language from message text.
        
        Args:
            text: Message text
            
        Returns:
            Detected language (defaults to English)
        """
        text_lower = text.lower()
        
        # Count keyword matches for each language
        scores = {lang: 0 for lang in Language}
        
        for lang, keywords in LANGUAGE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[lang] += 1
        
        # Find language with highest score
        max_lang = max(scores, key=scores.get)
        
        if scores[max_lang] > 0:
            return max_lang
        
        return Language.ENGLISH
    
    def get_user_language(self, user_id: str) -> Language:
        """Get stored language preference for a user."""
        return self._user_languages.get(user_id, self.default_language)
    
    def set_user_language(self, user_id: str, language: Language) -> None:
        """Set language preference for a user."""
        self._user_languages[user_id] = language
        logger.info(f"Language set to {language.value} for user {user_id}")
    
    def translate(
        self, 
        key: str, 
        language: Optional[Language] = None,
        **kwargs
    ) -> str:
        """
        Get translated text for a key.
        
        Args:
            key: Translation key (e.g., "greeting", "product_found")
            language: Target language (defaults to English)
            **kwargs: Format variables (e.g., product_name, price)
            
        Returns:
            Translated and formatted string
        """
        lang = language or self.default_language
        
        translations = TRANSLATIONS.get(key, {})
        text = translations.get(lang, translations.get(Language.ENGLISH, key))
        
        try:
            return text.format(**kwargs)
        except KeyError:
            # If formatting fails, return unformatted
            return text
    
    def get_available_languages(self) -> Dict[str, str]:
        """Get list of available languages."""
        return {
            Language.ENGLISH.value: "English",
            Language.PIDGIN.value: "Nigerian Pidgin",
            Language.HAUSA.value: "Hausa",
            Language.IGBO.value: "Igbo",
            Language.YORUBA.value: "Yorùbá"
        }
    
    def format_currency(self, amount: float, language: Language = Language.ENGLISH) -> str:
        """Format currency amount."""
        return f"₦{amount:,.0f}"


# Singleton instance
localization_service = LocalizationService()


# Convenience function
def t(key: str, language: Language = Language.ENGLISH, **kwargs) -> str:
    """Shortcut for translation."""
    return localization_service.translate(key, language, **kwargs)

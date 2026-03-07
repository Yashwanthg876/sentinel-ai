from deep_translator import GoogleTranslator
import logging

def translate_query(text: str) -> tuple[str, str]:
    """
    Detects the user's input language and translates it into English to 
    ensure the RAG vector search works optimally.
    Returns: (english_translation: str, source_language_code: str)
    """
    try:
        translator = GoogleTranslator(source='auto', target='en')
        lang = getattr(translator, "source", "unknown")
        # Ensure 'source' gets correctly inferred by doing a translation
        en_text = translator.translate(text)
        
        # Unfortunately, older deep-translator versions don't always expose the detected language easily, 
        # so we do a quick check to see if the translation matches the original.
        if text.strip().lower() == en_text.strip().lower():
            # Likely English natively
            return (en_text, "en")
            
        # We will pass 'auto' as a flag downstream to signify a non-english text was passed
        return (en_text, "auto")
    except Exception as e:
        logging.error(f"Translation error: {e}")
        return (text, "en")

def translate_response(text: str, target_lang: str) -> str:
    """
    Translates the English response back to the user's native tongue
    """
    if target_lang == "en" or not target_lang:
        return text
        
    try:
        # Note: If target_lang is 'auto', it means we detected foreign text. 
        # In this implementation, to provide Multi-lingual we can just allow the Frontend 
        # to explicitly define language, or try to detect it.
        # However, for robustness, if target_lang is an actual language code, we translate directly.
        translator = GoogleTranslator(source='en', target=target_lang)
        return translator.translate(text)
    except Exception as e:
        logging.error(f"Response translation error: {e}")
        return text

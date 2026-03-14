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
        
        # Truncate queries to 4900 chars just to be safe from API crash
        query_text = text[:4900]
        # Ensure 'source' gets correctly inferred by doing a translation
        en_text = translator.translate(query_text)
        
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
        translator = GoogleTranslator(source='en', target=target_lang)
        # Handle 5000 character limit of Google Translate
        if len(text) > 4900:
            chunks = [text[i:i+4900] for i in range(0, len(text), 4900)]
            translated_chunks = [translator.translate(chunk) for chunk in chunks]
            return "".join(translated_chunks)
        else:
            return translator.translate(text)
    except Exception as e:
        import traceback
        logging.error(f"Response translation error: {e}")
        traceback.print_exc()
        return text

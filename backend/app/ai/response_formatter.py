class ResponseFormatter:
    """
    Cleans and formats the natural language response from Gemini.
    """

    @staticmethod
    def format(response_text: str | None) -> str:
        """
        Removes unnecessary whitespace, validates the response, 
        and provides a fallback message if empty.
        """
        if not response_text:
            return "I'm unable to provide a response at the moment. Please check your data or try again later."
            
        cleaned_text = response_text.strip()
        
        if not cleaned_text:
            return "I'm unable to provide a response at the moment. Please check your data or try again later."
             
        # Keep formatting clean
        # If any specific markdown stripping is needed, it can be added here.
        # But we instructed Gemini to avoid markdown.
        return cleaned_text

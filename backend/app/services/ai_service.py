"""
AI spam detection service
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SpamDetector:
    def __init__(self):
        # Allow single characters and don't use stop words to avoid empty vocabulary on short inputs
        self.vectorizer = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b')
        self.posts_data = []  # List of strings (title + description)
        self.tfidf_matrix = None

    def fit_data(self, posts):
        """
        Refits the TF-IDF vectorizer with the current list of posts.
        posts: list of strings (combined title + description)
        """
        self.posts_data = posts
        if not self.posts_data:
            self.tfidf_matrix = None
            return

        try:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.posts_data)
        except ValueError:
            # Handle case where vocabulary is empty or other sklearn errors
            self.tfidf_matrix = None

    def is_spam(self, new_post_text, threshold=0.85):
        """
        Checks if new_post_text is similar to any existing post.
        Returns (bool, float): (is_spam, max_similarity_score)
        """
        if self.tfidf_matrix is None or not self.posts_data:
            return False, 0.0
        
        try:
            new_vec = self.vectorizer.transform([new_post_text])
            cosine_sims = cosine_similarity(new_vec, self.tfidf_matrix) 
            max_sim = np.max(cosine_sims)
            
            return max_sim > threshold, max_sim
        except Exception as e:
            print(f"Error in AI check: {e}")
            return False, 0.0

# Global AI detector instance
ai_detector = SpamDetector()

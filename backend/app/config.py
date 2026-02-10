"""
Configuration classes for different environments
"""
import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev_key_secret'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Instance directory for uploaded files, AI models, etc.
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    INSTANCE_DIR = os.path.join(os.path.dirname(BASE_DIR), 'instance')
    
    # Database - PostgreSQL only
    # Render provides DATABASE_URL environment variable
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError(
            "DATABASE_URL environment variable is required. "
            "Please set it to your PostgreSQL connection string."
        )

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    # For local development, you can use a local PostgreSQL instance
    # Example: postgresql://username:password@localhost:5432/flostfound_dev

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    
    # Validate required environment variables
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable is required in production")

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    # Use a separate test database
    # Override DATABASE_URL for testing if needed
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        os.environ.get('DATABASE_URL')

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

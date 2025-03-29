from sqlalchemy import Column, String, Boolean, Float, Date, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    clerk_id = Column(String(50), primary_key=True)
    username = Column(String(50), nullable=True)
    preferences = Column(JSON, nullable=True)
    recommended_job_ids = Column(JSON, nullable=True)  # Stores list of job IDs
    interested_job_ids = Column(JSON, nullable=True)  # Stores jobs user liked
    not_interested_job_ids = Column(JSON, nullable=True)  # Stores jobs user disliked
    # saved_jobs_ids = Column(JSON, nullable=True)  # Stores jobs user saved
    is_pro = Column(Boolean, default=False)
    resume_text = Column(Text, nullable=True)  # Stores extracted text from resume
    resume_path = Column(String(500), nullable=True)  # Stores path to resume file
    resume_keywords = Column(JSON, nullable=True)  # Stores keywords extracted from resume

# Define Job model
class Job(Base):
    __tablename__ = 'jobs'

    id = Column(String(100), primary_key=True)
    site = Column(String(50))
    job_url = Column(String(500))
    job_url_direct = Column(String(500), nullable=True)
    title = Column(String(200))
    company = Column(String(200))
    location = Column(String(200), nullable=True)
    date_posted = Column(Date, nullable=True)
    job_type = Column(String(50), nullable=True)
    salary_source = Column(String(50), nullable=True)
    interval = Column(String(50), nullable=True)
    min_amount = Column(Float, nullable=True)
    max_amount = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)
    is_remote = Column(Boolean, nullable=True)
    description = Column(Text, nullable=True)
    last_updated = Column(Date, default=datetime.now().date())
    company_logo = Column(String(500), nullable=True)
    # Add relationship with JobInteractionStats
    stats = relationship("JobInteractionStats", back_populates="job", uselist=False)
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key not in ['company_industry', 'company_url',
                          'company_url_direct', 'company_addresses', 'company_num_employees',
                          'company_revenue', 'company_description', 'skills', 'experience_range',
                          'company_rating', 'company_reviews_count', 'vacancy_count', 
                          'work_from_home_type', 'job_level', 'job_function', 'listing_type', 
                          'emails']:
                setattr(self, key, value)

class JobInteractionStats(Base):
    __tablename__ = 'job_interaction_stats'
    
    job_id = Column(String(100), ForeignKey('jobs.id'), primary_key=True)
    like_count = Column(Integer, default=0)
    dislike_count = Column(Integer, default=0)
    bookmark_count = Column(Integer, default=0)
    last_updated = Column(Date, default=datetime.now().date())
    
    # Define relationship with Job model
    job = relationship("Job", back_populates="stats")
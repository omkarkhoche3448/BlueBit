import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import logging
from datetime import datetime
import json
import threading
import time
import schedule
from sqlalchemy import create_engine, Column, String, Boolean, Float, Date, Text, Integer, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.dialects.postgresql import JSON
import os
from models import Job, User    
from dotenv import load_dotenv
# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

load_dotenv()
# Set up SQLAlchemy with Neon PostgreSQL
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")
Base = declarative_base()
engine = create_engine(DATABASE_URL)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)


class RecommendationEngine:
    def __init__(self):
        self.model_updated_at = None
        self.job_features = None
        self.job_similarity_matrix = None
        self.user_job_matrix = None
        self.tfidf_vectorizer = None
        self.user_embeddings = {}
        self.job_clusters = None
        self.trending_jobs = []
        
    def preprocess_jobs(self):
        """Extract and preprocess job data for recommendations"""
        session = Session()
        try:
            # Get all jobs from database
            jobs = session.query(Job).all()
            
            # Convert to DataFrame
            job_data = []
            for job in jobs:
                job_dict = {c.name: getattr(job, c.name) for c in job.__table__.columns}
                job_data.append(job_dict)
            
            jobs_df = pd.DataFrame(job_data)
            
            # Create feature text for each job (combining relevant fields with weighted importance)
            jobs_df['feature_text'] = jobs_df.apply(
                lambda x: ' '.join(filter(None, [
                    (str(x['title']) + ' ') * 3 if x['title'] else '',  # Title has higher weight
                    str(x['company']) if x['company'] else '',
                    str(x['location']) if x['location'] else '',
                    str(x['job_type']) if x['job_type'] else '',
                    str(x['description']) if x['description'] else ''
                ])), axis=1
            )
            
            # Create TF-IDF vectors with improved parameters
            self.tfidf_vectorizer = TfidfVectorizer(
                stop_words='english', 
                max_features=10000,  # Increased from 5000
                ngram_range=(1, 2),  # Include bigrams
                min_df=2,            # Minimum document frequency
                max_df=0.85          # Maximum document frequency
            )
            job_features = self.tfidf_vectorizer.fit_transform(jobs_df['feature_text'])
            
            # Calculate job-job similarity matrix
            job_similarity = cosine_similarity(job_features)
            
            # Create job clusters for diversity in recommendations
            self._create_job_clusters(job_features, jobs_df)
            
            # Identify trending jobs based on recency and other factors
            self._identify_trending_jobs(jobs_df)
            
            # Store results
            self.job_features = job_features
            self.job_similarity_matrix = job_similarity
            self.jobs_df = jobs_df
            
            logging.info(f"Preprocessed {len(jobs_df)} jobs for recommendations")
            return True
            
        except Exception as e:
            logging.error(f"Error preprocessing jobs: {str(e)}")
            return False
        finally:
            session.close()
    
    def _create_job_clusters(self, job_features, jobs_df, n_clusters=10):
        """Create clusters of similar jobs for diversity in recommendations"""
        try:
            from sklearn.cluster import KMeans
            
            # Create clusters
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            clusters = kmeans.fit_predict(job_features)
            
            # Add cluster information to jobs dataframe
            jobs_df['cluster'] = clusters
            
            # Store cluster information
            self.job_clusters = {i: jobs_df[jobs_df['cluster'] == i]['id'].tolist() for i in range(n_clusters)}
            
            logging.info(f"Created {n_clusters} job clusters for diversity")
        except Exception as e:
            logging.error(f"Error creating job clusters: {str(e)}")
            self.job_clusters = None
    
    def _identify_trending_jobs(self, jobs_df):
        """Identify trending jobs based on recency and other factors"""
        try:
            # Create a copy to avoid modifying the original
            trending_df = jobs_df.copy()
            
            # Filter out jobs with null descriptions
            trending_df = trending_df[trending_df['description'].notna()]
            
            # Calculate trending score based on recency
            current_date = datetime.now().date()
            
            # Convert date_posted to datetime if it's not
            if 'date_posted' in trending_df.columns:
                trending_df['days_since_posted'] = trending_df['date_posted'].apply(
                    lambda x: (current_date - x).days if pd.notnull(x) else 30
                )
                
                # Calculate recency score (higher for more recent jobs)
                trending_df['recency_score'] = trending_df['days_since_posted'].apply(
                    lambda x: max(0, 1 - (x / 30)) if x <= 30 else 0
                )
                
                # Add engagement factors to trending score
                if 'application_count' in trending_df.columns and 'view_count' in trending_df.columns:
                    trending_df['engagement_score'] = (
                        trending_df['application_count'] * 0.7 + 
                        trending_df['view_count'] * 0.3
                    )
                    trending_df['recency_score'] = trending_df['recency_score'] * 0.6 + trending_df['engagement_score'] * 0.4
                else:
                    trending_df['engagement_score'] = 0  # Create a default engagement score
                
                # Prioritize jobs with complete profiles
                # (No need to check description anymore since we filtered for that)
                trending_df['completeness_score'] = trending_df.apply(
                    lambda x: 1 if all(pd.notnull(x[field]) for field in ['company', 'location']) else 0,
                    axis=1
                )
                
                trending_df = trending_df.sort_values(
                    ['completeness_score', 'recency_score', 'engagement_score'], 
                    ascending=[False, False, False]
                )
                
                # Sort by recency score
                trending_df = trending_df.sort_values('recency_score', ascending=False)
                
                # Get top trending jobs
                self.trending_jobs = trending_df.head(50)['id'].tolist()
            else:
                self.trending_jobs = []
                
            logging.info(f"Identified {len(self.trending_jobs)} trending jobs with descriptions")
        except Exception as e:
            logging.error(f"Error identifying trending jobs: {str(e)}")
            self.trending_jobs = []

    def build_user_job_matrix(self):
        """Build a matrix of user interactions with jobs"""
        session = Session()
        try:
            # Get all users
            users = session.query(User).all()
            
            # Get all job IDs
            job_ids = self.jobs_df['id'].tolist()
            
            # Create user-job interaction matrix
            user_job_matrix = {}
            
            for user in users:
                user_id = user.clerk_id
                user_job_matrix[user_id] = {}
                
                # Handle potential string representation in SQLite
                interested_jobs = user.interested_job_ids
                not_interested_jobs = user.not_interested_job_ids
                
                if isinstance(interested_jobs, str):
                    try:
                        interested_jobs = json.loads(interested_jobs)
                    except:
                        interested_jobs = []
                        
                if isinstance(not_interested_jobs, str):
                    try:
                        not_interested_jobs = json.loads(not_interested_jobs)
                    except:
                        not_interested_jobs = []
                
                # Fill matrix with interactions
                for job_id in job_ids:
                    if interested_jobs and job_id in interested_jobs:
                        user_job_matrix[user_id][job_id] = 1  # Liked
                    elif not_interested_jobs and job_id in not_interested_jobs:
                        user_job_matrix[user_id][job_id] = -1  # Disliked
                    else:
                        user_job_matrix[user_id][job_id] = 0  # No interaction
            
            self.user_job_matrix = user_job_matrix
            logging.info(f"Built user-job matrix for {len(users)} users")
            return True
            
        except Exception as e:
            logging.error(f"Error building user-job matrix: {str(e)}")
            return False
        finally:
            session.close()
    
    def compute_similarities(self, user_embedding, job_features):
        """Vectorized cosine similarity computation for better performance"""
        # Convert sparse matrix to dense if needed
        if isinstance(job_features, np.ndarray):
            job_features_array = job_features
        else:
            job_features_array = job_features.toarray()
        
        # Normalize vectors for cosine similarity
        user_norm = np.linalg.norm(user_embedding)
        job_norms = np.linalg.norm(job_features_array, axis=1)
        
        # Avoid division by zero
        job_norms[job_norms == 0] = 1e-10
        
        # Compute dot product and divide by norms
        similarities = np.dot(job_features_array, user_embedding) / (job_norms * user_norm)
        
        return similarities

    def get_content_based_recommendations(self, user_id, top_n=20):
        """Generate content-based recommendations for a user based on their preferences and behavior"""
        session = Session()
        try:
            user = session.query(User).filter(User.clerk_id == user_id).first()
            
            if not user:
                logging.warning(f"User {user_id} not found for content-based recommendations")
                return []
            
            # Get user preferences
            preferences = user.preferences or {}
            
            # Extract user liked and disliked jobs
            interested_jobs = user.interested_job_ids
            not_interested_jobs = user.not_interested_job_ids
            
            # Ensure interested_jobs is a list
            if interested_jobs is None:
                interested_jobs = []
            elif isinstance(interested_jobs, str):
                try:
                    interested_jobs = json.loads(interested_jobs)
                except:
                    interested_jobs = []
            
            # Ensure not_interested_jobs is a list
            if not_interested_jobs is None:
                not_interested_jobs = []
            elif isinstance(not_interested_jobs, str):
                try:
                    not_interested_jobs = json.loads(not_interested_jobs)
                except:
                    not_interested_jobs = []
            
            # Get resume keywords for enhanced matching
            resume_keywords = user.resume_keywords
            if resume_keywords is None:
                resume_keywords = []
            elif isinstance(resume_keywords, str):
                try:
                    resume_keywords = json.loads(resume_keywords)
                except:
                    resume_keywords = []
            
            # Improved preference check
            has_preferences = bool(preferences and isinstance(preferences, dict) and len(preferences) > 0)
            
            # Fixed check
            if not any([interested_jobs, resume_keywords, has_preferences]):
                logging.info(f"User {user_id} has no signals - using trending job fallback")
                
                # Get trending or popular jobs as fallback
                fallback_jobs = []
                
                # Use trending jobs if available
                if self.trending_jobs:
                    fallback_jobs = self.trending_jobs[:top_n]
                    logging.info(f"Providing {len(fallback_jobs)} trending jobs as fallback for user {user_id}")
                
                # If no trending jobs, get most recent jobs
                if not fallback_jobs and hasattr(self, 'jobs_df') and 'date_posted' in self.jobs_df.columns:
                    recent_jobs = self.jobs_df.sort_values('date_posted', ascending=False)['id'].tolist()[:top_n]
                    fallback_jobs = recent_jobs
                    logging.info(f"Providing {len(fallback_jobs)} recent jobs as fallback for user {user_id}")
                
                # If still no jobs, get jobs from diverse clusters
                if not fallback_jobs and self.job_clusters:
                    for cluster in self.job_clusters.values():
                        fallback_jobs.extend(cluster[:5])  # Get a few jobs from each cluster
                    fallback_jobs = list(dict.fromkeys(fallback_jobs))[:top_n]  # Remove duplicates
                    logging.info(f"Providing {len(fallback_jobs)} diverse jobs as fallback for user {user_id}")
                
                # If still nothing, get any jobs
                if not fallback_jobs and hasattr(self, 'jobs_df'):
                    fallback_jobs = self.jobs_df['id'].tolist()[:top_n]
                    logging.info(f"Providing {len(fallback_jobs)} random jobs as last fallback for user {user_id}")
                
                session.close()
                return fallback_jobs
            
            # If user has liked jobs, use them for content-based recommendations
            if interested_jobs:
                # If user has an embedding, use it for recommendations
                if user_id in self.user_embeddings:
                    user_embedding = self.user_embeddings[user_id]
                    
                    # Use vectorized similarity computation for better performance
                    user_job_similarities = []
                    
                    # Calculate similarity between user embedding and all jobs using vectorized operations
                    similarities = self.compute_similarities(user_embedding, self.job_features)
                    
                    for i, similarity in enumerate(similarities):
                        job_id = self.jobs_df.iloc[i]['id']
                        
                        # Apply resume keyword boost if available
                        if resume_keywords:
                            job_description = str(self.jobs_df.iloc[i]['description']).lower()
                            job_title = str(self.jobs_df.iloc[i]['title']).lower()
                            keyword_matches = sum(1 for keyword in resume_keywords if keyword.lower() in job_description or keyword.lower() in job_title)
                            # Apply a boost based on keyword matches (0.05 per match, up to 0.5)
                            keyword_boost = min(0.5, keyword_matches * 0.05)
                            similarity += keyword_boost
                        
                        user_job_similarities.append((job_id, similarity))
                    
                    # Sort by similarity
                    user_job_similarities.sort(key=lambda x: x[1], reverse=True)
                    
                    # Remove jobs the user has already interacted with
                    interacted_jobs = interested_jobs + not_interested_jobs if not_interested_jobs else interested_jobs
                    filtered_similarities = [(job_id, sim) for job_id, sim in user_job_similarities 
                                            if job_id not in interacted_jobs]
                    
                    # Get top recommendations
                    recommended_job_ids = [job_id for job_id, _ in filtered_similarities[:top_n]]
                    
                    return recommended_job_ids
                
                # Fall back to original method if no embedding
                # Find indices of liked jobs in the jobs_df
                liked_indices = []
                for job_id in interested_jobs:
                    if job_id in self.jobs_df['id'].values:
                        idx = self.jobs_df[self.jobs_df['id'] == job_id].index[0]
                        liked_indices.append(idx)
                
                if not liked_indices:
                    return []
                
                # Calculate average similarity to liked jobs
                sim_scores = np.zeros(len(self.jobs_df))
                for idx in liked_indices:
                    sim_scores += self.job_similarity_matrix[idx]
                
                if len(liked_indices) > 0:
                    sim_scores /= len(liked_indices)
                
                # Create a Series with job IDs and similarity scores
                job_sim = pd.Series(sim_scores, index=self.jobs_df['id'])
                
                # Apply resume keyword boost if available
                if resume_keywords:
                    for job_id in job_sim.index:
                        job_idx = self.jobs_df[self.jobs_df['id'] == job_id].index[0]
                        job_description = str(self.jobs_df.iloc[job_idx]['description']).lower()
                        job_title = str(self.jobs_df.iloc[job_idx]['title']).lower()
                        
                        # Count keyword matches in description and title
                        keyword_matches = sum(1 for keyword in resume_keywords if keyword.lower() in job_description or keyword.lower() in job_title)
                        
                        # Apply a boost based on keyword matches (0.05 per match, up to 0.5)
                        keyword_boost = min(0.5, keyword_matches * 0.05)
                        job_sim[job_id] += keyword_boost
                
                # Remove jobs the user has already interacted with
                interacted_jobs = interested_jobs + not_interested_jobs if not_interested_jobs else interested_jobs
                job_sim = job_sim[~job_sim.index.isin(interacted_jobs)]
                
                # Sort and get top recommendations
                job_sim = job_sim.sort_values(ascending=False)
                recommended_job_ids = job_sim.index[:top_n].tolist()
                
                return recommended_job_ids
            
            # If no liked jobs, use preferences and resume keywords for filtering
            else:
                filtered_jobs = self.jobs_df.copy()
                
                # Apply filters based on preferences
                if preferences and isinstance(preferences, dict):
                    if preferences.get('jobType'):
                        job_type = preferences['jobType']
                        filtered_jobs = filtered_jobs[filtered_jobs['job_type'].str.contains(job_type, na=False, case=False)]
                    
                    if preferences.get('location'):
                        location = preferences['location']
                        filtered_jobs = filtered_jobs[filtered_jobs['location'].str.contains(location, na=False, case=False)]
                    
                    if preferences.get('isRemote') == True:
                        filtered_jobs = filtered_jobs[filtered_jobs['is_remote'] == True]
                    
                    # Add salary preferences if available
                    if preferences.get('minSalary'):
                        min_salary = float(preferences['minSalary'])
                        filtered_jobs = filtered_jobs[
                            (filtered_jobs['min_amount'].notnull() & (filtered_jobs['min_amount'] >= min_salary)) |
                            (filtered_jobs['max_amount'].notnull() & (filtered_jobs['max_amount'] >= min_salary))
                        ]
                
                # Apply resume keyword matching if available - with higher weight
                if resume_keywords:
                    # Create a score column for keyword matches with higher weight
                    filtered_jobs['keyword_score'] = filtered_jobs.apply(
                        lambda job: sum(2 for keyword in resume_keywords 
                                      if keyword.lower() in str(job['description']).lower()) +
                                   sum(3 for keyword in resume_keywords 
                                      if keyword.lower() in str(job['title']).lower()),
                        axis=1
                    )
                    
                    # Sort by keyword matches (descending) and then by date
                    if 'date_posted' in filtered_jobs.columns:
                        filtered_jobs = filtered_jobs.sort_values(['keyword_score', 'date_posted'], ascending=[False, False])
                    else:
                        filtered_jobs = filtered_jobs.sort_values('keyword_score', ascending=False)
                else:
                    # Sort by date posted (most recent first) if no keywords
                    if 'date_posted' in filtered_jobs.columns:
                        filtered_jobs = filtered_jobs.sort_values('date_posted', ascending=False)
                
                # Remove jobs the user has already interacted with
                interacted_jobs = interested_jobs + not_interested_jobs if not_interested_jobs else interested_jobs
                filtered_jobs = filtered_jobs[~filtered_jobs['id'].isin(interacted_jobs)]
                
                recommended_job_ids = filtered_jobs['id'].head(top_n).tolist()
                
                # Add debug logging
                logging.debug(f"Prefs filtered to {len(filtered_jobs)} jobs | "
                             f"Keywords: {len(resume_keywords)} | "
                             f"Trending available: {bool(self.trending_jobs)}")
                
                # If no matches, try relaxing filters
                if len(recommended_job_ids) < top_n//2:  # If less than half found
                    logging.info("Insufficient matches - applying fallback strategy")
                    # Expand search with relaxed preferences
                    return self._fallback_recommendations(user, top_n)
                
                # If we don't have enough recommendations, add trending jobs
                if len(recommended_job_ids) < top_n and self.trending_jobs:
                    additional_jobs = [job_id for job_id in self.trending_jobs 
                                      if job_id not in recommended_job_ids 
                                      and job_id not in interacted_jobs]
                    recommended_job_ids.extend(additional_jobs[:top_n - len(recommended_job_ids)])
                
                return recommended_job_ids
            
        except Exception as e:
            logging.error(f"Error generating content-based recommendations: {str(e)}")
            return []
        finally:
            session.close()
    
    def _fallback_recommendations(self, user, top_n):
        """Fallback when primary methods fail"""
        try:
            # Return a mix of trending and diverse jobs
            universal_recommendations = []
            reason = "No user preferences, keywords, or liked jobs available"
            
            # Add some trending jobs if available
            if self.trending_jobs:
                universal_recommendations.extend(self.trending_jobs[:top_n//2])
                logging.info(f"Added {len(universal_recommendations)} trending jobs to fallback recommendations")
                    
            # Add jobs from different clusters for diversity
            if self.job_clusters and len(universal_recommendations) < top_n:
                cluster_count = 0
                for cluster in self.job_clusters.values():
                    if len(universal_recommendations) < top_n:
                        # Take a few jobs from each cluster
                        cluster_jobs = [j for j in cluster[:3] if j not in universal_recommendations]
                        universal_recommendations.extend(cluster_jobs)
                        cluster_count += 1
                logging.info(f"Added jobs from {cluster_count} clusters for diversity")
            
            # If still not enough, add most recent jobs
            if len(universal_recommendations) < top_n and hasattr(self, 'jobs_df') and 'date_posted' in self.jobs_df.columns:
                recent_jobs = self.jobs_df.sort_values('date_posted', ascending=False)['id'].tolist()
                additional = [j for j in recent_jobs if j not in universal_recommendations]
                universal_recommendations.extend(additional[:top_n - len(universal_recommendations)])
                logging.info(f"Added recent jobs to reach {len(universal_recommendations)} recommendations total")
            
            # Return unique recommendations up to requested count
            final_recs = list(dict.fromkeys(universal_recommendations))[:top_n]
            logging.info(f"Returning {len(final_recs)} fallback recommendations with reason: {reason}")
            return final_recs
                
        except Exception as e:
            logging.error(f"Fallback failed: {str(e)}")
            # Ultimate fallback - just return trending or any jobs we have
            if self.trending_jobs:
                return self.trending_jobs[:top_n]
            elif hasattr(self, 'jobs_df'):
                return self.jobs_df['id'].tolist()[:top_n]
            return []  # Empty only if absolutely nothing else is available

    def get_collaborative_recommendations(self, user_id, top_n=20):
        """Generate collaborative filtering recommendations for a user"""
        session = Session()
        try:
            if not self.user_job_matrix or user_id not in self.user_job_matrix:
                logging.warning(f"No user-job matrix data for user {user_id}")
                return []
            
            user = session.query(User).filter(User.clerk_id == user_id).first()
            
            if not user:
                logging.warning(f"User {user_id} not found for collaborative recommendations")
                return []
            
            # Get user interactions
            user_interactions = self.user_job_matrix[user_id]
            
            # If user has no interactions, can't do collaborative filtering
            if not any(user_interactions.values()):
                logging.info(f"User {user_id} has no interactions for collaborative filtering")
                return []
            
            # Vectorized user similarity calculation
            job_ids = list(user_interactions.keys())
            user_vector = np.array([user_interactions[job_id] for job_id in job_ids])
            
            # Calculate similarities in batches for better memory management
            batch_size = 50  # Adjust based on memory constraints
            user_similarities = {}
            user_ids = list(self.user_job_matrix.keys())
            
            for i in range(0, len(user_ids), batch_size):
                batch_user_ids = user_ids[i:i+batch_size]
                batch_vectors = []
                valid_batch_ids = []
                
                for other_user_id in batch_user_ids:
                    if other_user_id == user_id:
                        continue
                    
                    other_interactions = self.user_job_matrix[other_user_id]
                    other_vector = np.array([other_interactions.get(job_id, 0) for job_id in job_ids])
                    
                    # Skip users with no common interactions
                    common_interactions = (user_vector != 0) & (other_vector != 0)
                    if np.sum(common_interactions) > 0:
                        batch_vectors.append(other_vector)
                        valid_batch_ids.append(other_user_id)
                
                if not batch_vectors:
                    continue
                    
                # Convert to numpy array for vectorized operations
                batch_matrix = np.vstack(batch_vectors)
                
                # Calculate dot products (numerator for similarity)
                # Only consider where both users have interactions (non-zero values)
                similarities = np.zeros(len(valid_batch_ids))
                common_counts = np.zeros(len(valid_batch_ids))
                
                for j in range(len(valid_batch_ids)):
                    common_mask = (user_vector != 0) & (batch_matrix[j] != 0)
                    if np.any(common_mask):
                        similarities[j] = np.sum(user_vector[common_mask] * batch_matrix[j][common_mask])
                        common_counts[j] = np.sum(common_mask)
                
                # Normalize by number of common items
                mask = common_counts > 0
                similarities[mask] = similarities[mask] / common_counts[mask]
                
                # Store results
                for idx, other_user_id in enumerate(valid_batch_ids):
                    if similarities[idx] > 0:
                        user_similarities[other_user_id] = similarities[idx]
            
            # Vectorized job scoring
            job_scores = {}
            for other_user_id, similarity in user_similarities.items():
                other_interactions = self.user_job_matrix[other_user_id]
                
                # Process in batches for memory efficiency
                for job_id, rating in other_interactions.items():
                    # Skip jobs the user has already interacted with or jobs with negative ratings
                    if user_interactions.get(job_id, 0) != 0 or rating <= 0:
                        continue
                    
                    if job_id not in job_scores:
                        job_scores[job_id] = 0
                    job_scores[job_id] += similarity * rating
            
            # Sort jobs by score
            recommended_jobs = sorted(job_scores.items(), key=lambda x: x[1], reverse=True)
            recommended_job_ids = [job_id for job_id, score in recommended_jobs[:top_n]]
            
            return recommended_job_ids
            
        except Exception as e:
            logging.error(f"Error generating collaborative recommendations: {str(e)}")
            return []
        finally:
            session.close()
    
    def get_hybrid_recommendations(self, user_id, top_n=20):
        """Generate hybrid recommendations combining content-based, collaborative filtering, and diversity"""
        try:
            session = Session()
            user = session.query(User).filter(User.clerk_id == user_id).first()
            
            if not user:
                return []
            
            # Get user interactions
            interested_jobs = user.interested_job_ids
            not_interested_jobs = user.not_interested_job_ids
            
            if isinstance(interested_jobs, str):
                try:
                    interested_jobs = json.loads(interested_jobs)
                except:
                    interested_jobs = []
                    
            if isinstance(not_interested_jobs, str):
                try:
                    not_interested_jobs = json.loads(not_interested_jobs)
                except:
                    not_interested_jobs = []
            
            # Check if user has resume keywords or preferences
            resume_keywords = user.resume_keywords
            if isinstance(resume_keywords, str):
                try:
                    resume_keywords = json.loads(resume_keywords)
                except:
                    resume_keywords = []
            
            preferences = user.preferences or {}
            has_preferences = bool(preferences and isinstance(preferences, dict) and 
                                  (preferences.get('jobType') or preferences.get('location') or 
                                   preferences.get('isRemote') is not None or preferences.get('minSalary')))
            
            # Fixed check - use trending jobs fallback
            if not any([interested_jobs, resume_keywords, has_preferences]):
                logging.info(f"User {user_id} has no signals - using trending job fallback")
                
                # Get trending or popular jobs as fallback
                fallback_jobs = []
                
                # Use trending jobs if available
                if self.trending_jobs:
                    fallback_jobs = self.trending_jobs[:top_n]
                    logging.info(f"Providing {len(fallback_jobs)} trending jobs as fallback for user {user_id}")
                
                # If no trending jobs, get most recent jobs
                if not fallback_jobs and hasattr(self, 'jobs_df') and 'date_posted' in self.jobs_df.columns:
                    recent_jobs = self.jobs_df.sort_values('date_posted', ascending=False)['id'].tolist()[:top_n]
                    fallback_jobs = recent_jobs
                    logging.info(f"Providing {len(fallback_jobs)} recent jobs as fallback for user {user_id}")
                
                # If still no jobs, get jobs from diverse clusters
                if not fallback_jobs and self.job_clusters:
                    for cluster in self.job_clusters.values():
                        fallback_jobs.extend(cluster[:5])  # Get a few jobs from each cluster
                    fallback_jobs = list(dict.fromkeys(fallback_jobs))[:top_n]  # Remove duplicates
                    logging.info(f"Providing {len(fallback_jobs)} diverse jobs as fallback for user {user_id}")
                
                # If still nothing, get any jobs
                if not fallback_jobs and hasattr(self, 'jobs_df'):
                    fallback_jobs = self.jobs_df['id'].tolist()[:top_n]
                    logging.info(f"Providing {len(fallback_jobs)} random jobs as last fallback for user {user_id}")
                
                session.close()
                return fallback_jobs
            
            # Get recommendations from both approaches
            content_recs = self.get_content_based_recommendations(user_id, top_n=top_n) or []
            collab_recs = self.get_collaborative_recommendations(user_id, top_n=top_n) or []
            
            interacted_jobs = interested_jobs + not_interested_jobs if not_interested_jobs else interested_jobs
            
            # Determine weights based on user history and profile
            if len(interested_jobs) > 5:  # User has significant history
                collab_weight = 0.6
                content_weight = 0.4
            elif resume_keywords or has_preferences:  # User has resume or preferences but few likes
                collab_weight = 0.2
                content_weight = 0.8
            else:  # New user with little history and no resume/preferences
                collab_weight = 0.3
                content_weight = 0.7
            
            # Vectorized scoring for hybrid recommendations
            all_job_ids = list(set(content_recs + collab_recs))
            
            # If no recommendations from either method, return empty list
            if not all_job_ids:
                logging.info(f"No recommendations available for user {user_id}")
                session.close()
                return []
            
            # Determine weights based on user history and profile
            if len(interested_jobs) > 5:  # User has significant history
                collab_weight = 0.6
                content_weight = 0.4
            elif resume_keywords or has_preferences:  # User has resume or preferences but few likes
                collab_weight = 0.2
                content_weight = 0.8
            else:  # New user with little history and no resume/preferences
                collab_weight = 0.3
                content_weight = 0.7
            
            # Vectorized scoring for hybrid recommendations
            all_job_ids = list(set(content_recs + collab_recs))
            
            # If no recommendations from either method, return empty list
            if not all_job_ids:
                logging.info(f"No recommendations available for user {user_id}")
                session.close()
                return []
                
            job_scores = np.zeros(len(all_job_ids))
            job_id_to_idx = {job_id: idx for idx, job_id in enumerate(all_job_ids)}
            
            # Score content recommendations
            if content_recs:
                content_scores = np.array([1.0 - (i / len(content_recs)) for i in range(len(content_recs))])
                content_indices = [job_id_to_idx[job_id] for job_id in content_recs]
                job_scores[content_indices] += content_weight * content_scores
            
            # Score collaborative recommendations
            if collab_recs:
                collab_scores = np.array([1.0 - (i / len(collab_recs)) for i in range(len(collab_recs))])
                collab_indices = [job_id_to_idx[job_id] for job_id in collab_recs]
                job_scores[collab_indices] += collab_weight * collab_scores
            
            # Get top scoring jobs
            top_indices = np.argsort(-job_scores)
            top_percent = int(top_n * 0.7)
            hybrid_recs = [all_job_ids[idx] for idx in top_indices[:top_percent]]
            
            # Add diversity by including jobs from different clusters
            if self.job_clusters and len(hybrid_recs) < top_n:
                # Identify clusters already represented in recommendations
                represented_clusters = set()
                for job_id in hybrid_recs:
                    if job_id in self.jobs_df['id'].values:
                        job_idx = self.jobs_df[self.jobs_df['id'] == job_id].index[0]
                        cluster = self.jobs_df.iloc[job_idx]['cluster']
                        represented_clusters.add(cluster)
                
                # Add jobs from underrepresented clusters
                remaining_slots = top_n - len(hybrid_recs)
                for cluster in range(len(self.job_clusters)):
                    if cluster not in represented_clusters and remaining_slots > 0:
                        # Find jobs from this cluster that the user hasn't interacted with
                        cluster_jobs = [
                            job_id for job_id in self.job_clusters[cluster]
                            if job_id not in interacted_jobs and job_id not in hybrid_recs
                        ]
                        # Add jobs from this cluster until slots are filled
                        for job_id in cluster_jobs:
                            if remaining_slots <= 0:
                                break
                            hybrid_recs.append(job_id)
                            remaining_slots -= 1
            
            # Add trending jobs if we still need more recommendations
            if len(hybrid_recs) < top_n and self.trending_jobs:
                remaining_slots = top_n - len(hybrid_recs)
                for job_id in self.trending_jobs:
                    if job_id not in interacted_jobs and job_id not in hybrid_recs and remaining_slots > 0:
                        hybrid_recs.append(job_id)
                        remaining_slots -= 1
            
            session.close()
            return hybrid_recs[:top_n]
            
        except Exception as e:
            logging.error(f"Error generating hybrid recommendations: {str(e)}")
            return content_recs  # Fall back to content-based if hybrid fails
    
    def update_user_recommendations(self):
        """Update stored recommendations for all users"""
        logging.info(f"Starting batch processing of recommendations")
        
        # Get all user IDs first (without keeping the objects)
        session = Session()
        user_ids = [user.clerk_id for user in session.query(User).all()]
        session.close()
        
        # Process each user with a fresh session
        for user_id in user_ids:
            session = Session()  # Create a new session for each user
            try:
                # Get fresh user object in this session
                user = session.query(User).filter(User.clerk_id == user_id).first()
                if not user:
                    logging.warning(f"User {user_id} not found")
                    continue
                    
                # Generate recommendations
                recommendation_ids = self.get_hybrid_recommendations(user_id, top_n=50)
                
                # Ensure recommendation_ids is a list
                if recommendation_ids is None:
                    recommendation_ids = []
                    
                # Try direct update first
                try:
                    user.recommended_job_ids = recommendation_ids
                    session.commit()
                    logging.info(f"Updated recommendations for user {user_id}: {len(recommendation_ids)} jobs")
                except Exception as e:
                    logging.error(f"ORM update failed for user {user_id}: {str(e)}")
                    session.rollback()
                    
                    # Try raw SQL as fallback
                    try:
                        json_data = json.dumps(recommendation_ids)
                        sql = text("UPDATE users SET recommended_job_ids = :json_data WHERE clerk_id = :user_id")
                        session.execute(sql, {"json_data": json_data, "user_id": user_id})
                        session.commit()
                        logging.info(f"SQL update successful for user {user_id}")
                    except Exception as sql_e:
                        logging.error(f"SQL update failed for user {user_id}: {str(sql_e)}")
                        session.rollback()
                
            except Exception as e:
                logging.error(f"Error processing recommendations for user {user_id}: {str(e)}")
                session.rollback()
            finally:
                session.close()  # Always close the session
        
        logging.info(f"Completed batch processing of recommendations")
        return True
    
    def initialize_model(self):
        """Initialize the recommendation model"""
        try:
            # Check if database has data first
            session = Session()
            job_count = session.query(Job).count()
            user_count = session.query(User).count()
            session.close()
            
            if job_count == 0 or user_count == 0:
                logging.warning("Delaying recommendation initialization - database not populated")
                return False
                
            # Preprocess jobs
            if not self.preprocess_jobs():
                logging.error("Failed to preprocess jobs")
                return False
            
            # Build user-job matrix
            if not self.build_user_job_matrix():
                logging.error("Failed to build user-job matrix")
                return False
            
            # Update recommendations for all users
            if not self.update_user_recommendations():
                logging.error("Failed to update user recommendations")
                return False
            
            self.model_updated_at = datetime.now()
            logging.info(f"Recommendation model initialized at {self.model_updated_at}")
            return True
            
        except Exception as e:
            logging.error(f"Error initializing recommendation model: {str(e)}")
            return False

    def update_recommendations_once(self):
        """Update recommendations once without scheduling"""
        logging.info("Running one-time recommendation model update")
        return self.initialize_model()

# Create a global instance of the recommendation engine
recommendation_engine = RecommendationEngine()

def init_recommendation_engine():
    """Initialize the recommendation engine"""
    logging.info("Initializing recommendation engine...")
    recommendation_engine.initialize_model()
    # Don't automatically start the scheduler - only start when API endpoint is called

# Function to get recommendations for a user
def get_recommendations_for_user(user_id, count=20):
    """Get recommendations for a specific user"""
    session = Session()
    try:
        user = session.query(User).filter(User.clerk_id == user_id).first()
        
        if not user:
            logging.warning(f"User {user_id} not found")
            return []
        
        # If user has recommendations stored, return those
        if user.recommended_job_ids:
            # Handle potential string representation
            if isinstance(user.recommended_job_ids, str):
                try:
                    recommended_job_ids = json.loads(user.recommended_job_ids)
                except:
                    recommended_job_ids = []
            else:
                recommended_job_ids = user.recommended_job_ids
                
            logging.info(f"Using existing recommendations for user {user_id}: {len(recommended_job_ids if recommended_job_ids else [])} jobs")
            
            # Get the job details for these IDs
            jobs = session.query(Job).filter(Job.id.in_(recommended_job_ids)).all()
            
            # Convert to list of dictionaries - FIXED
            job_list = []
            for job in jobs:
                job_dict = {}
                for column in job.__table__.columns:
                    job_dict[column.name] = getattr(job, column.name)
                job_list.append(job_dict)
            
            # Calculate matching score for each job
            job_list = calculate_matching_scores(job_list, user)
            
            # Sort according to the order in recommended_job_ids
            job_dict = {job['id']: job for job in job_list}
            sorted_jobs = [job_dict[job_id] for job_id in recommended_job_ids if job_id in job_dict]
            
            return sorted_jobs[:count]
        
        # If no stored recommendations, generate them on the fly
        else:
            logging.info(f"Generating new recommendations for user {user_id}")
            
            # Get recommendation IDs
            recommendation_ids = recommendation_engine.get_hybrid_recommendations(user_id, top_n=50)
            
            # Store in database - using a new session to avoid conflicts
            if recommendation_ids:
                # Close current session
                session.close()
                
                # Create new session specifically for the update
                update_session = Session()
                try:
                    # Get fresh user object in the new session
                    update_user = update_session.query(User).filter(User.clerk_id == user_id).first()
                    if update_user:
                        # Try ORM update
                        update_user.recommended_job_ids = recommendation_ids
                        update_session.commit()
                        logging.info(f"Stored {len(recommendation_ids)} recommendations for user {user_id}")
                except Exception as e:
                    logging.error(f"Failed to store recommendations: {str(e)}")
                    update_session.rollback()
                    
                    # Try SQL update as fallback
                    try:
                        json_data = json.dumps(recommendation_ids)
                        sql = text("UPDATE users SET recommended_job_ids = :json_data WHERE clerk_id = :user_id")
                        update_session.execute(sql, {"json_data": json_data, "user_id": user_id})
                        update_session.commit()
                        logging.info(f"SQL update successful for user {user_id}")
                    except Exception as sql_e:
                        logging.error(f"SQL update also failed: {str(sql_e)}")
                        update_session.rollback()
                finally:
                    update_session.close()
                
                # Create a new session for retrieving jobs for display
                session = Session()
            
            # Get the job details for display
            display_ids = recommendation_ids[:count] if recommendation_ids else []
            jobs = session.query(Job).filter(Job.id.in_(display_ids)).all()
            
            # Convert to list of dictionaries - FIXED
            job_list = []
            for job in jobs:
                job_dict = {}
                for column in job.__table__.columns:
                    job_dict[column.name] = getattr(job, column.name)
                job_list.append(job_dict)
            
            # Get fresh user object for matching score calculation
            user = session.query(User).filter(User.clerk_id == user_id).first()
            
            # Calculate matching score for each job
            job_list = calculate_matching_scores(job_list, user)
            
            # Sort according to the order in recommendation_ids
            job_dict = {job['id']: job for job in job_list}
            sorted_jobs = [job_dict[job_id] for job_id in display_ids if job_id in job_dict]
            
            return sorted_jobs
    except Exception as e:
        logging.error(f"Error getting recommendations for user {user_id}: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return []
    finally:
        session.close()

def calculate_matching_scores(job_list, user):
    """Calculate matching score for each job based on user profile and preferences"""
    try:
        # Get user preferences
        preferences = user.preferences or {}
        
        # Get resume keywords
        resume_keywords = user.resume_keywords
        if resume_keywords is None:
            resume_keywords = []
        elif isinstance(resume_keywords, str):
            try:
                resume_keywords = json.loads(resume_keywords)
            except:
                resume_keywords = []
        
        # Process each job
        for job in job_list:
            score = 35  # Lower base score as requested (was 50)
            score_factors = {}  # Track individual factors for debugging
            
            # Match job type
            if preferences.get('jobType') and job.get('job_type'):
                if preferences['jobType'].lower() in job['job_type'].lower():
                    score += 15
                    score_factors['job_type'] = 15
            
            # Match location
            if preferences.get('location') and job.get('location'):
                if preferences['location'].lower() in job['location'].lower():
                    score += 15
                    score_factors['location'] = 15
            
            # Match remote preference
            if preferences.get('isRemote') == True and job.get('is_remote') == True:
                score += 10
                score_factors['remote'] = 10
            
            # Match salary
            if preferences.get('minSalary') and (job.get('min_amount') or job.get('max_amount')):
                min_salary = float(preferences['minSalary'])
                job_min = job.get('min_amount', 0)
                job_max = job.get('max_amount', 0)
                
                if (job_min and job_min >= min_salary) or (job_max and job_max >= min_salary):
                    salary_score = 10
                    if job_min and job_min >= min_salary * 1.2:  # 20% above minimum
                        salary_score += 5
                    score += salary_score
                    score_factors['salary'] = salary_score
            
            # Match resume keywords
            if resume_keywords and (job.get('description') or job.get('title')):
                description = str(job.get('description', '')).lower()
                title = str(job.get('title', '')).lower()
                
                keyword_matches = sum(1 for keyword in resume_keywords 
                                    if keyword.lower() in description or keyword.lower() in title)
                
                keyword_score = min(25, keyword_matches * 2.5)  # Up to 25 points for keywords
                score += keyword_score
                score_factors['keywords'] = keyword_score
            
            # Cap score at 100
            score = min(100, score)
            
            # Add score to job dictionary
            job['matching_score'] = score
            job['score_factors'] = score_factors
        
        return job_list
        
    except Exception as e:
        logging.error(f"Error calculating matching scores: {str(e)}")
        # Return original job list if scoring fails
        return job_list
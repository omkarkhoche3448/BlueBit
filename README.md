# BlueBit
BlueBit
# BlueBit - AI-Powered Job Search & Resume Platform

BlueBit is a comprehensive job search platform that helps job seekers find opportunities, analyze their resumes with ATS scoring, and manage their job applications - all in one place.

## Features

- **AI-Powered Resume Analysis**: Get detailed ATS scoring and feedback
- **Job Search**: Search and filter job listings from multiple sources (Indeed, LinkedIn, Glassdoor)
- **Job Management**: Save jobs and track applications
- **Resume Creation**: Build professional resumes with guided templates
- **Real-time Updates**: Stay informed about new job listings and application statuses

## Project Structure

├── Backend/               # Flask backend server
│   ├── app.py             # Resume analysis API

│   ├── jobs.py            # Job search and management API

│   └── requirements.txt   # Python dependencies

│   ├── public/            # Static assets

│   │   ├── components/    # Reusable UI components

│   │   ├── pages/         # Page components

│   │   ├── slices/        # Redux state slices

│   │   └── ...

│   └── ...

└── README.md              # Project documentation

BlueBit/
├── Backend/               # Flask backend server
│   ├── app.py             # Resume analysis API
│   ├── jobs.py            # Job search and management API
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── slices/        # Redux state slices
│   │   └── ...
│   └── ...
└── README.md              # Project documentation
```

## Backend API Endpoints

### Resume Analysis API
- `POST /api/analyze`: Analyze a resume (PDF/DOCX) and get ATS scoring

### Job Search & Management API
- `GET/POST /api/search-jobs`: Search for jobs with filters
- `GET /api/job/<job_id>`: Get job details by ID
- `POST /api/apply-job/<job_id>`: Mark a job as applied
- `POST/DELETE /api/save-job/<job_id>`: Save or remove a job from saved jobs

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- API key for Google Generative AI (Gemini)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd BlueBit/Backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up your environment variables:
   ```
   # Create a .env file with your Google API key
   GEMINI_API_KEY=your_api_key_here
   ```

5. Run the Flask servers:
   ```
   # Run the resume analysis server
   python app.py
   
   # In another terminal, run the jobs API server
   python jobs.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd BlueBit/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Contributing

We welcome contributions to BlueBit! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**:
   ```
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```
   git commit -m 'Add some amazing feature'
   ```
4. **Push to your branch**:
   ```
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed

## Deployment

### Backend Deployment
- The backend can be deployed using Gunicorn and Nginx on a VPS
- Alternatively, deploy to services like Heroku, AWS Elastic Beanstalk, or Google App Engine

### Frontend Deployment
- Build the production version: `npm run build`
- Deploy the `dist` folder to services like Netlify, Vercel, or GitHub Pages

## Technologies Used

### Backend
- Flask: Web framework
- Google Generative AI (Gemini): AI-powered resume analysis
- JobSpy: Job scraping library
- PyPDF2 & python-docx: Document parsing

### Frontend
- React 19
- Redux Toolkit: State management
- React Router: Navigation
- Tailwind CSS: Styling
- Lucide React: Icons
- Axios: API client

## License

This project is licensed under the MIT License.

## Acknowledgments

- JobSpy for providing job search capabilities
- Google Gemini API for powerful AI analysis

## Contact

For any questions or support, please reach out to the project maintainers at:
- Email: support@bluebit.dev
- Twitter: [@BlueBitDev](https://twitter.com/BlueBitDev)
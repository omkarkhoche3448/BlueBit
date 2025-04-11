# **BlueBit - AI-Powered Job Search & Resume Platform**

**BlueBit** is a comprehensive job search platform that helps job seekers find opportunities, analyze their resumes with ATS scoring, and manage job applications — all in one place.

---

## 🚀 Features

- **AI-Powered Resume Analysis**: Get detailed ATS scoring and feedback.
- **Job Search**: Search and filter job listings from multiple sources (Indeed, LinkedIn, Glassdoor).
- **Job Management**: Save jobs and track applications.
- **Resume Creation**: Build professional resumes with guided templates.
- **Real-Time Updates**: Stay informed about new job listings and application statuses.

---

## 🗂️ Project Structure

```
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
└── README.md              # Project documentation
```

---

## 📡 Backend API Endpoints

### ✍️ Resume Analysis API
- `POST /api/analyze`: Analyze a resume (PDF/DOCX) and get ATS scoring.

### 💼 Job Search & Management API
- `GET/POST /api/search-jobs`: Search for jobs with filters.
- `GET /api/job/<job_id>`: Get job details by ID.
- `POST /api/apply-job/<job_id>`: Mark a job as applied.
- `POST/DELETE /api/save-job/<job_id>`: Save or unsave a job.

---

## 🛠️ Getting Started

### ✅ Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- API key for Google Generative AI (Gemini)

---

### 🧪 Backend Setup

```bash
cd BlueBit/Backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your Google API key
GEMINI_API_KEY=your_api_key_here

# Run the servers
python app.py        # Resume analysis API
python jobs.py       # Job search API
```

---

### 🌐 Frontend Setup

```bash
cd BlueBit/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Visit the app
http://localhost:5173
```

---

## 🤝 Contributing

We welcome contributions to BlueBit!

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add some amazing feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a pull request.

### 🧾 Development Guidelines
- Follow existing code style.
- Write tests for new features.
- Update documentation as needed.

---

## 🚀 Deployment

### Backend
- Use **Gunicorn + NGINX** on a VPS (e.g., EC2), or deploy via:
  - Heroku
  - AWS Elastic Beanstalk
  - Google App Engine

### Frontend
- Build production version:
  ```bash
  npm run build
  ```
- Deploy the `dist/` folder to:
  - Netlify
  - Vercel
  - GitHub Pages

---

## 🧰 Technologies Used

### Backend
- **Flask**: Web framework
- **Google Gemini API**: Resume analysis
- **JobSpy**: Job scraping
- **PyPDF2**, **python-docx**: Resume parsing

### Frontend
- **React 19**
- **Redux Toolkit**: State management
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Axios**: API client

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🙌 Acknowledgments

- JobSpy for providing job search capabilities
- Google Gemini API for powerful AI analysis

## Contact

For any questions or support, please reach out to the project maintainers at:
- Email: support@bluebit.dev
- Twitter: [@BlueBitDev](https://twitter.com/BlueBitDev)


- [JobSpy](https://github.com/realTristan/jobspy) for providing job scraping tools.
- [Google Gemini API](https://ai.google.dev/) for powerful resume analysis.


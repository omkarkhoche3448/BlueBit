export const mockJobs = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechCorp",
      company_url: "https://techcorp.example.com",
      job_url: "https://techcorp.example.com/careers/senior-frontend-developer",
      location: {
        country: "United States",
        city: "San Francisco",
        state: "CA",
      },
      is_remote: true,
      description: `
        <p>We are looking for a Senior Frontend Developer to join our team. You will be responsible for building and maintaining our web applications.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Develop new user-facing features</li>
          <li>Build reusable code and libraries for future use</li>
          <li>Ensure the technical feasibility of UI/UX designs</li>
          <li>Optimize applications for maximum speed and scalability</li>
          <li>Collaborate with other team members and stakeholders</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>5+ years of experience in frontend development</li>
          <li>Proficiency with JavaScript, React, and modern frontend frameworks</li>
          <li>Experience with responsive design and cross-browser compatibility</li>
          <li>Strong understanding of web performance optimization</li>
          <li>Excellent problem-solving skills and attention to detail</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Software Development", "Frontend Development"],
      salary: {
        interval: "yearly",
        min_amount: 120000,
        max_amount: 160000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-10T12:00:00Z",
      emails: ["careers@techcorp.example.com"],
      skills: ["React", "JavaScript", "TypeScript", "CSS", "HTML", "Redux"],
      // LinkedIn specific
      job_level: "Senior",
      // LinkedIn & Indeed specific
      company_industry: "Technology",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["123 Tech St, San Francisco, CA 94105"],
      company_employees_label: "500-1000",
      company_revenue_label: "$50M-$100M",
      company_description: "TechCorp is a leading technology company specializing in web and mobile applications.",
    },
    {
      id: "2",
      title: "Data Scientist",
      company: "Analytics Co",
      company_url: "https://analyticsco.example.com",
      job_url: "https://analyticsco.example.com/careers/data-scientist",
      location: {
        country: "United States",
        city: "New York",
        state: "NY",
      },
      is_remote: false,
      description: `
        <p>We are seeking a talented Data Scientist to help us discover insights from data and build machine learning models.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Develop machine learning models and algorithms</li>
          <li>Analyze large datasets to extract actionable insights</li>
          <li>Create data visualizations to communicate findings</li>
          <li>Collaborate with engineering teams to implement models</li>
          <li>Stay up-to-date with the latest research and technologies</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>3+ years of experience in data science or related field</li>
          <li>Strong programming skills in Python</li>
          <li>Experience with machine learning libraries (TensorFlow, PyTorch, scikit-learn)</li>
          <li>Knowledge of statistical analysis and data visualization</li>
          <li>MS or PhD in Computer Science, Statistics, or related field</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Data Science", "Machine Learning"],
      salary: {
        interval: "yearly",
        min_amount: 110000,
        max_amount: 140000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-15T09:30:00Z",
      emails: ["hiring@analyticsco.example.com"],
      skills: ["Python", "Machine Learning", "SQL", "Data Visualization", "Statistics"],
      // LinkedIn specific
      job_level: "Mid-Senior",
      // LinkedIn & Indeed specific
      company_industry: "Data & Analytics",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["456 Data Ave, New York, NY 10001"],
      company_employees_label: "100-500",
      company_revenue_label: "$10M-$50M",
      company_description:
        "Analytics Co is a data-driven company that helps businesses make better decisions through advanced analytics.",
    },
    {
      id: "3",
      title: "Product Manager",
      company: "Product Innovators",
      company_url: "https://productinnovators.example.com",
      job_url: "https://productinnovators.example.com/careers/product-manager",
      location: {
        country: "Remote",
        city: "",
        state: "",
      },
      is_remote: true,
      description: `
        <p>We're looking for an experienced Product Manager to lead the development of our flagship product.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Define product vision, strategy, and roadmap</li>
          <li>Gather and prioritize product requirements</li>
          <li>Work closely with engineering, design, and marketing teams</li>
          <li>Analyze market trends and competitive landscape</li>
          <li>Drive product launches and go-to-market strategies</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>5+ years of experience in product management</li>
          <li>Track record of successful product launches</li>
          <li>Strong analytical and problem-solving skills</li>
          <li>Excellent communication and leadership abilities</li>
          <li>Technical background preferred</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Product Management", "Strategy"],
      salary: {
        interval: "yearly",
        min_amount: 130000,
        max_amount: 170000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-18T14:45:00Z",
      emails: ["jobs@productinnovators.example.com"],
      skills: ["Product Strategy", "Agile", "User Research", "Market Analysis", "Roadmapping"],
      // LinkedIn specific
      job_level: "Senior",
      // LinkedIn & Indeed specific
      company_industry: "Software",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["Global - Remote"],
      company_employees_label: "50-100",
      company_revenue_label: "$5M-$10M",
      company_description:
        "Product Innovators creates cutting-edge software solutions that transform how businesses operate.",
    },
    {
      id: "4",
      title: "UX Designer",
      company: "Design Studio",
      company_url: "https://designstudio.example.com",
      job_url: "https://designstudio.example.com/careers/ux-designer",
      location: {
        country: "United States",
        city: "Austin",
        state: "TX",
      },
      is_remote: true,
      description: `
        <p>Join our creative team as a UX Designer to create beautiful, intuitive user experiences for our clients.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Create wireframes, prototypes, and user flows</li>
          <li>Conduct user research and usability testing</li>
          <li>Collaborate with product managers and developers</li>
          <li>Design intuitive and accessible user interfaces</li>
          <li>Contribute to our design system</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>3+ years of experience in UX/UI design</li>
          <li>Proficiency with design tools (Figma, Sketch, Adobe XD)</li>
          <li>Portfolio demonstrating strong design thinking</li>
          <li>Understanding of accessibility standards</li>
          <li>Excellent communication and collaboration skills</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Design", "User Experience"],
      salary: {
        interval: "yearly",
        min_amount: 90000,
        max_amount: 120000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-20T10:15:00Z",
      emails: ["careers@designstudio.example.com"],
      skills: ["UI/UX", "Figma", "User Research", "Wireframing", "Prototyping"],
      // LinkedIn specific
      job_level: "Mid-Level",
      // LinkedIn & Indeed specific
      company_industry: "Design",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["789 Design Blvd, Austin, TX 78701"],
      company_employees_label: "20-50",
      company_revenue_label: "$1M-$5M",
      company_description:
        "Design Studio is a creative agency that specializes in user experience and interface design for digital products.",
    },
    {
      id: "5",
      title: "DevOps Engineer",
      company: "Cloud Systems",
      company_url: "https://cloudsystems.example.com",
      job_url: "https://cloudsystems.example.com/careers/devops-engineer",
      location: {
        country: "United States",
        city: "Seattle",
        state: "WA",
      },
      is_remote: false,
      description: `
        <p>We are looking for a DevOps Engineer to help us build and maintain our cloud infrastructure.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Design, implement, and manage CI/CD pipelines</li>
          <li>Automate infrastructure provisioning and configuration</li>
          <li>Monitor system performance and troubleshoot issues</li>
          <li>Implement security best practices</li>
          <li>Collaborate with development teams to improve deployment processes</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>5+ years of experience in DevOps or SRE roles</li>
          <li>Strong knowledge of cloud platforms (AWS, Azure, GCP)</li>
          <li>Experience with containerization and orchestration (Docker, Kubernetes)</li>
          <li>Proficiency with infrastructure as code (Terraform, CloudFormation)</li>
          <li>Scripting and automation skills (Python, Bash)</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["DevOps", "Infrastructure"],
      salary: {
        interval: "yearly",
        min_amount: 125000,
        max_amount: 165000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-22T16:30:00Z",
      emails: ["jobs@cloudsystems.example.com"],
      skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
      // LinkedIn specific
      job_level: "Senior",
      // LinkedIn & Indeed specific
      company_industry: "Cloud Computing",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["101 Cloud Ave, Seattle, WA 98101"],
      company_employees_label: "100-500",
      company_revenue_label: "$10M-$50M",
      company_description: "Cloud Systems provides cloud infrastructure and DevOps solutions for enterprises.",
    },
    {
      id: "6",
      title: "Backend Developer",
      company: "ServerTech",
      company_url: "https://servertech.example.com",
      job_url: "https://servertech.example.com/careers/backend-developer",
      location: {
        country: "United States",
        city: "Chicago",
        state: "IL",
      },
      is_remote: true,
      description: `
        <p>We're seeking a Backend Developer to build robust and scalable APIs and services.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Design and develop backend services and APIs</li>
          <li>Optimize application performance and scalability</li>
          <li>Implement security and data protection measures</li>
          <li>Write clean, maintainable, and well-tested code</li>
          <li>Collaborate with frontend developers and other team members</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>3+ years of experience in backend development</li>
          <li>Proficiency with at least one backend language (Node.js, Python, Java, etc.)</li>
          <li>Experience with databases (SQL and NoSQL)</li>
          <li>Knowledge of API design and development</li>
          <li>Understanding of cloud services and microservices architecture</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Software Development", "Backend Development"],
      salary: {
        interval: "yearly",
        min_amount: 100000,
        max_amount: 130000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-25T11:00:00Z",
      emails: ["careers@servertech.example.com"],
      skills: ["Node.js", "Python", "MongoDB", "REST APIs", "Microservices"],
      // LinkedIn specific
      job_level: "Mid-Level",
      // LinkedIn & Indeed specific
      company_industry: "Technology",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["202 Server St, Chicago, IL 60601"],
      company_employees_label: "50-100",
      company_revenue_label: "$5M-$10M",
      company_description: "ServerTech builds backend infrastructure and services for web and mobile applications.",
    },
    {
      id: "7",
      title: "Marketing Manager",
      company: "Growth Experts",
      company_url: "https://growthexperts.example.com",
      job_url: "https://growthexperts.example.com/careers/marketing-manager",
      location: {
        country: "United States",
        city: "Boston",
        state: "MA",
      },
      is_remote: true,
      description: `
        <p>Join our team as a Marketing Manager to develop and execute marketing strategies that drive growth.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Develop and implement marketing campaigns across channels</li>
          <li>Manage digital marketing initiatives (SEO, SEM, social media)</li>
          <li>Analyze marketing metrics and optimize campaigns</li>
          <li>Collaborate with product and sales teams</li>
          <li>Manage marketing budget and resources</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>5+ years of experience in marketing roles</li>
          <li>Strong understanding of digital marketing channels</li>
          <li>Experience with marketing analytics and tools</li>
          <li>Excellent communication and project management skills</li>
          <li>Bachelor's degree in Marketing or related field</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Marketing", "Digital Marketing"],
      salary: {
        interval: "yearly",
        min_amount: 95000,
        max_amount: 125000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-28T09:45:00Z",
      emails: ["jobs@growthexperts.example.com"],
      skills: ["Digital Marketing", "SEO", "Content Strategy", "Analytics", "Campaign Management"],
      // LinkedIn specific
      job_level: "Senior",
      // LinkedIn & Indeed specific
      company_industry: "Marketing & Advertising",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["303 Growth St, Boston, MA 02110"],
      company_employees_label: "20-50",
      company_revenue_label: "$1M-$5M",
      company_description: "Growth Experts is a marketing agency that helps businesses acquire and retain customers.",
    },
    {
      id: "8",
      title: "Mobile Developer (iOS)",
      company: "App Creators",
      company_url: "https://appcreators.example.com",
      job_url: "https://appcreators.example.com/careers/ios-developer",
      location: {
        country: "Remote",
        city: "",
        state: "",
      },
      is_remote: true,
      description: `
        <p>We're looking for an iOS Developer to join our mobile team and build amazing user experiences.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Develop and maintain iOS applications</li>
          <li>Collaborate with designers to implement UI/UX</li>
          <li>Ensure performance, quality, and responsiveness of applications</li>
          <li>Identify and fix bugs and performance bottlenecks</li>
          <li>Stay up-to-date with Apple's design principles and guidelines</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>3+ years of experience in iOS development</li>
          <li>Proficiency with Swift and iOS frameworks</li>
          <li>Experience with RESTful APIs and third-party libraries</li>
          <li>Understanding of the full mobile development lifecycle</li>
          <li>Knowledge of code versioning tools (Git)</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Software Development", "Mobile Development"],
      salary: {
        interval: "yearly",
        min_amount: 110000,
        max_amount: 140000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-03-30T13:20:00Z",
      emails: ["careers@appcreators.example.com"],
      skills: ["Swift", "iOS", "Xcode", "UIKit", "SwiftUI", "Core Data"],
      // LinkedIn specific
      job_level: "Mid-Level",
      // LinkedIn & Indeed specific
      company_industry: "Mobile Development",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["Global - Remote"],
      company_employees_label: "20-50",
      company_revenue_label: "$1M-$5M",
      company_description: "App Creators develops innovative mobile applications for iOS and Android platforms.",
    },
    {
      id: "9",
      title: "Full Stack Developer",
      company: "Web Solutions",
      company_url: "https://websolutions.example.com",
      job_url: "https://websolutions.example.com/careers/full-stack-developer",
      location: {
        country: "United States",
        city: "Denver",
        state: "CO",
      },
      is_remote: true,
      description: `
        <p>Join our team as a Full Stack Developer to build and maintain web applications from front to back.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Develop both frontend and backend components of web applications</li>
          <li>Build responsive user interfaces with modern JavaScript frameworks</li>
          <li>Design and implement RESTful APIs and database schemas</li>
          <li>Optimize applications for performance and scalability</li>
          <li>Collaborate with cross-functional teams</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>3+ years of experience in full stack development</li>
          <li>Proficiency with JavaScript/TypeScript and modern frameworks (React, Angular, Vue)</li>
          <li>Experience with backend technologies (Node.js, Python, Ruby)</li>
          <li>Knowledge of databases (SQL, NoSQL)</li>
          <li>Understanding of web development best practices</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Software Development", "Full Stack Development"],
      salary: {
        interval: "yearly",
        min_amount: 105000,
        max_amount: 135000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-04-02T10:00:00Z",
      emails: ["jobs@websolutions.example.com"],
      skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express", "REST APIs"],
      // LinkedIn specific
      job_level: "Mid-Level",
      // LinkedIn & Indeed specific
      company_industry: "Web Development",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["404 Web Ave, Denver, CO 80202"],
      company_employees_label: "50-100",
      company_revenue_label: "$5M-$10M",
      company_description: "Web Solutions provides end-to-end web development services for businesses of all sizes.",
    },
    {
      id: "10",
      title: "Data Engineer",
      company: "Data Systems",
      company_url: "https://datasystems.example.com",
      job_url: "https://datasystems.example.com/careers/data-engineer",
      location: {
        country: "United States",
        city: "Atlanta",
        state: "GA",
      },
      is_remote: false,
      description: `
        <p>We are seeking a Data Engineer to design and build data pipelines and infrastructure.</p>
        <h3>Responsibilities:</h3>
        <ul>
          <li>Design, build, and maintain data processing systems</li>
          <li>Develop ETL processes and data pipelines</li>
          <li>Optimize data storage and retrieval systems</li>
          <li>Ensure data quality, security, and compliance</li>
          <li>Collaborate with data scientists and analysts</li>
        </ul>
        <h3>Requirements:</h3>
        <ul>
          <li>5+ years of experience in data engineering</li>
          <li>Proficiency with data processing frameworks (Spark, Hadoop)</li>
          <li>Experience with cloud data platforms (Snowflake, BigQuery, Redshift)</li>
          <li>Strong SQL and programming skills (Python, Scala)</li>
          <li>Knowledge of data modeling and architecture</li>
        </ul>
      `,
      job_type: "fulltime",
      job_function: ["Data Engineering", "Data Infrastructure"],
      salary: {
        interval: "yearly",
        min_amount: 120000,
        max_amount: 150000,
        currency: "USD",
        salary_source: "direct_data",
      },
      date_posted: "2023-04-05T15:30:00Z",
      emails: ["careers@datasystems.example.com"],
      skills: ["Python", "SQL", "Spark", "ETL", "Data Warehousing", "AWS"],
      // LinkedIn specific
      job_level: "Senior",
      // LinkedIn & Indeed specific
      company_industry: "Data & Analytics",
      // Indeed specific
      company_logo: "https://img.naukimg.com/logo_images/groups/v1/158114.gif",
      company_country: "United States",
      company_addresses: ["505 Data Dr, Atlanta, GA 30303"],
      company_employees_label: "100-500",
      company_revenue_label: "$10M-$50M",
      company_description: "Data Systems specializes in building scalable data infrastructure and analytics solutions.",
    },
  ]
  
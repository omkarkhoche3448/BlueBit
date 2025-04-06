"use client"

import { useState, useEffect, useRef } from "react"
import {
  Download,
  Eye,
  FileText,
  Save,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  X,
  Layout,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Languages,
  Link,
  ArrowLeftRight,
} from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

// Resume data structure
const initialResumeData = {
  personalInfo: {
    name: "John Doe",
    title: "Software Engineer",
    email: "john.doe@example.com",
    phone: "(123) 456-7890",
    location: "San Francisco, CA",
    website: "johndoe.com",
    linkedin: "linkedin.com/in/johndoe",
  },
  summary:
    "Experienced software engineer with a passion for building scalable web applications and solving complex problems.",
  experience: [
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      location: "San Francisco, CA",
      startDate: "Jan 2020",
      endDate: "Present",
      description:
        "Led development of cloud-based applications using React and Node.js. Improved system performance by 40%.",
    },
    {
      id: 2,
      title: "Software Developer",
      company: "Digital Innovations",
      location: "San Jose, CA",
      startDate: "Jun 2017",
      endDate: "Dec 2019",
      description: "Developed and maintained web applications using JavaScript, HTML, and CSS.",
    },
  ],
  education: [
    {
      id: 1,
      degree: "Master of Science in Computer Science",
      institution: "Stanford University",
      location: "Stanford, CA",
      startDate: "2015",
      endDate: "2017",
      description: "Focus on artificial intelligence and machine learning.",
    },
    {
      id: 2,
      degree: "Bachelor of Science in Computer Science",
      institution: "University of California, Berkeley",
      location: "Berkeley, CA",
      startDate: "2011",
      endDate: "2015",
      description: "Graduated with honors. GPA: 3.8/4.0",
    },
  ],
  skills: [
    { name: "JavaScript", level: "Expert", years: "8" },
    { name: "React", level: "Advanced", years: "5" },
    { name: "Node.js", level: "Advanced", years: "6" },
    { name: "TypeScript", level: "Intermediate", years: "3" },
    { name: "HTML/CSS", level: "Expert", years: "10" },
    { name: "Python", level: "Intermediate", years: "4" },
    { name: "SQL", level: "Advanced", years: "7" },
    { name: "Git", level: "Advanced", years: "8" },
    { name: "AWS", level: "Intermediate", years: "4" },
    { name: "Docker", level: "Beginner", years: "2" },
  ],
  languages: [
    { name: "English", fluency: "Native", details: "Native speaker" },
    { name: "Spanish", fluency: "Intermediate", details: "Conversational proficiency" },
    { name: "French", fluency: "Basic", details: "Elementary proficiency" },
  ],
  certifications: [
    {
      id: 1,
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2022",
      expiration: "2025",
      credentialID: "AWS-123456",
    },
    {
      id: 2,
      name: "Certified Scrum Master",
      issuer: "Scrum Alliance",
      date: "2021",
      expiration: "2023",
      credentialID: "CSM-789012",
    },
  ],
}

// Proficiency levels for skills
const skillLevels = ["Beginner", "Intermediate", "Advanced", "Expert"]

// Fluency levels for languages
const fluencyLevels = ["Basic", "Intermediate", "Advanced", "Native", "Fluent", "Professional"]

// Template options
const templates = [
  { id: "modern", name: "Modern", color: "#3b82f6" },
  { id: "classic", name: "Classic", color: "#10b981" },
  { id: "minimal", name: "Minimal", color: "#6366f1" },
  { id: "professional", name: "Professional", color: "#f59e0b" },
]

export default function ResumeBuilder() {
  const [resumeData, setResumeData] = useState(initialResumeData)
  const [activeTemplate, setActiveTemplate] = useState(templates[0])
  const [activeSection, setActiveSection] = useState("personalInfo")
  const [editItem, setEditItem] = useState(null)
  const [primaryColor, setPrimaryColor] = useState(templates[0].color)
  const [splitView, setSplitView] = useState("horizontal") // 'horizontal', 'vertical', 'editor-only', 'preview-only'
  const [splitRatio, setSplitRatio] = useState(50) // percentage for split
  const splitDivRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [newSkill, setNewSkill] = useState({ name: "", level: "Intermediate", years: "" })
  const [newLanguage, setNewLanguage] = useState({ name: "", fluency: "Intermediate", details: "" })
  const previewRef = useRef(null)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024 && splitView === "horizontal") {
        setSplitView("vertical")
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [splitView])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && !event.target.closest(".download-menu-container")) {
        setShowDownloadMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDownloadMenu])

  // Handle template change
  const handleTemplateChange = (template) => {
    setActiveTemplate(template)
    setPrimaryColor(template.color)
  }

  // Handle resume data changes
  const updateResumeData = (section, data) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: data,
    }))
  }

  // Handle personal info changes
  const updatePersonalInfo = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }))
  }

  // Add new item to a section
  const addItem = (section, item) => {
    const newId = resumeData[section].length > 0 ? Math.max(...resumeData[section].map((i) => i.id || 0)) + 1 : 1

    const newItem = { ...item, id: newId }

    setResumeData((prev) => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }))
  }

  // Remove item from a section
  const removeItem = (section, id) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== id),
    }))
  }

  // Update item in a section
  const updateItem = (section, id, updatedItem) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: prev[section].map((item) => (item.id === id ? { ...item, ...updatedItem } : item)),
    }))
  }

  // Add skill
  const addSkill = () => {
    if (newSkill.name) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, { ...newSkill }],
      }))
      setNewSkill({ name: "", level: "Intermediate", years: "" })
    }
  }

  // Remove skill
  const removeSkill = (skillName) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.name !== skillName),
    }))
  }

  // Update skill
  const updateSkill = (index, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill, i) => (i === index ? { ...skill, [field]: value } : skill)),
    }))
  }

  // Add language
  const addLanguage = () => {
    if (newLanguage.name) {
      setResumeData((prev) => ({
        ...prev,
        languages: [...prev.languages, { ...newLanguage }],
      }))
      setNewLanguage({ name: "", fluency: "Intermediate", details: "" })
    }
  }

  // Remove language
  const removeLanguage = (languageName) => {
    setResumeData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.name !== languageName),
    }))
  }

  // Update language
  const updateLanguage = (index, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      languages: prev.languages.map((language, i) => (i === index ? { ...language, [field]: value } : language)),
    }))
  }

  // Download resume as PDF
  const downloadAsPDF = async () => {
    if (!previewRef.current) return

    try {
      const previewElement = previewRef.current
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${resumeData.personalInfo.name.replace(/\s+/g, "_")}_Resume.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating your PDF. Please try again.")
    }

    setShowDownloadMenu(false)
  }

  // Download resume as DOCX
  const downloadAsDOCX = () => {
    // In a real implementation, this would use a library like docx.js
    // For this demo, we'll create a simple text representation and save it as a .docx file

    let content = `${resumeData.personalInfo.name}\n`
    content += `${resumeData.personalInfo.title}\n`
    content += `${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}\n\n`

    content += `SUMMARY\n${resumeData.summary}\n\n`

    content += `EXPERIENCE\n`
    resumeData.experience.forEach((exp) => {
      content += `${exp.title} at ${exp.company}, ${exp.location}\n`
      content += `${exp.startDate} - ${exp.endDate}\n`
      content += `${exp.description}\n\n`
    })

    content += `EDUCATION\n`
    resumeData.education.forEach((edu) => {
      content += `${edu.degree}\n`
      content += `${edu.institution}, ${edu.location}\n`
      content += `${edu.startDate} - ${edu.endDate}\n`
      content += `${edu.description}\n\n`
    })

    content += `SKILLS\n`
    resumeData.skills.forEach((skill) => {
      content += `${skill.name} (${skill.level}, ${skill.years} years)\n`
    })

    content += `\nLANGUAGES\n`
    resumeData.languages.forEach((lang) => {
      content += `${lang.name} (${lang.fluency}): ${lang.details}\n`
    })

    content += `\nCERTIFICATIONS\n`
    resumeData.certifications.forEach((cert) => {
      content += `${cert.name}, ${cert.issuer}, ${cert.date}\n`
      if (cert.expiration) content += `Expires: ${cert.expiration}\n`
      if (cert.credentialID) content += `ID: ${cert.credentialID}\n`
      content += `\n`
    })

    const blob = new Blob([content], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
    saveAs(blob, `${resumeData.personalInfo.name.replace(/\s+/g, "_")}_Resume.docx`)

    setShowDownloadMenu(false)
  }

  // Download resume as TXT
  const downloadAsTXT = () => {
    let content = `${resumeData.personalInfo.name}\n`
    content += `${resumeData.personalInfo.title}\n`
    content += `${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}\n\n`

    content += `SUMMARY\n${resumeData.summary}\n\n`

    content += `EXPERIENCE\n`
    resumeData.experience.forEach((exp) => {
      content += `${exp.title} at ${exp.company}, ${exp.location}\n`
      content += `${exp.startDate} - ${exp.endDate}\n`
      content += `${exp.description}\n\n`
    })

    content += `EDUCATION\n`
    resumeData.education.forEach((edu) => {
      content += `${edu.degree}\n`
      content += `${edu.institution}, ${edu.location}\n`
      content += `${edu.startDate} - ${edu.endDate}\n`
      content += `${edu.description}\n\n`
    })

    content += `SKILLS\n`
    resumeData.skills.forEach((skill) => {
      content += `${skill.name} (${skill.level}, ${skill.years} years)\n`
    })

    content += `\nLANGUAGES\n`
    resumeData.languages.forEach((lang) => {
      content += `${lang.name} (${lang.fluency}): ${lang.details}\n`
    })

    content += `\nCERTIFICATIONS\n`
    resumeData.certifications.forEach((cert) => {
      content += `${cert.name}, ${cert.issuer}, ${cert.date}\n`
      if (cert.expiration) content += `Expires: ${cert.expiration}\n`
      if (cert.credentialID) content += `ID: ${cert.credentialID}\n`
      content += `\n`
    })

    const blob = new Blob([content], { type: "text/plain" })
    saveAs(blob, `${resumeData.personalInfo.name.replace(/\s+/g, "_")}_Resume.txt`)

    setShowDownloadMenu(false)
  }

  // Export to Overleaf (mock function)
  const exportToOverleaf = () => {
    alert("Exporting to Overleaf... (This would connect to Overleaf API in a real app)")
    setShowDownloadMenu(false)
  }

  // Handle split view changes
  const toggleSplitView = () => {
    if (splitView === "horizontal") {
      setSplitView("vertical")
    } else if (splitView === "vertical") {
      setSplitView("editor-only")
    } else if (splitView === "editor-only") {
      setSplitView("preview-only")
    } else {
      setSplitView("horizontal")
      if (isMobile) {
        setSplitView("vertical")
      }
    }
  }

  // Handle mouse down for resizing
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return

      const container = splitDivRef.current.parentElement
      const containerRect = container.getBoundingClientRect()

      if (splitView === "horizontal") {
        const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100
        setSplitRatio(Math.min(Math.max(newRatio, 30), 70)) // Limit between 30% and 70%
      } else if (splitView === "vertical") {
        const newRatio = ((e.clientY - containerRect.top) / containerRect.height) * 100
        setSplitRatio(Math.min(Math.max(newRatio, 30), 70)) // Limit between 30% and 70%
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, splitView])

  // Scroll the preview to the active section
  useEffect(() => {
    if (activeSection && splitView !== "editor-only") {
      const previewSection = document.getElementById(`preview-${activeSection}`)
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }, [activeSection, splitView])

  // Render the editor panel
  const renderEditorPanel = () => (
    <div className="h-full overflow-y-auto p-6">
      {activeSection === "personalInfo" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={resumeData.personalInfo.name}
                onChange={(e) => updatePersonalInfo("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
              <input
                type="text"
                value={resumeData.personalInfo.title}
                onChange={(e) => updatePersonalInfo("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={resumeData.personalInfo.email}
                onChange={(e) => updatePersonalInfo("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={resumeData.personalInfo.phone}
                onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={resumeData.personalInfo.location}
                onChange={(e) => updatePersonalInfo("location", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={resumeData.personalInfo.website}
                onChange={(e) => updatePersonalInfo("website", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="text"
                value={resumeData.personalInfo.linkedin}
                onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {activeSection === "summary" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Professional Summary</h2>
          <p className="text-sm text-gray-600 mb-3">
            A compelling summary that highlights your key qualifications and career goals.
          </p>
          <textarea
            value={resumeData.summary}
            onChange={(e) => updateResumeData("summary", e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a professional summary..."
          />
        </div>
      )}

      {activeSection === "experience" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Work Experience</h2>
            <button
              onClick={() =>
                setEditItem({
                  section: "experience",
                  isNew: true,
                  data: {
                    title: "",
                    company: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  },
                })
              }
              className="flex items-center px-3 py-1 rounded-md text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add Experience</span>
            </button>
          </div>

          {editItem && editItem.section === "experience" && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                {editItem.isNew ? "Add New Experience" : "Edit Experience"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={editItem.data.title}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, title: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editItem.data.company}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, company: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editItem.data.location}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, location: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="text"
                      value={editItem.data.startDate}
                      onChange={(e) =>
                        setEditItem({ ...editItem, data: { ...editItem.data, startDate: e.target.value } })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Jan 2020"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="text"
                      value={editItem.data.endDate}
                      onChange={(e) =>
                        setEditItem({ ...editItem, data: { ...editItem.data, endDate: e.target.value } })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Present"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editItem.data.description}
                  onChange={(e) =>
                    setEditItem({ ...editItem, data: { ...editItem.data, description: e.target.value } })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your responsibilities and achievements..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditItem(null)}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editItem.isNew) {
                      addItem("experience", editItem.data)
                    } else {
                      updateItem("experience", editItem.data.id, editItem.data)
                    }
                    setEditItem(null)
                  }}
                  className="px-3 py-1 rounded-md text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {editItem.isNew ? "Add" : "Update"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {resumeData.experience.map((exp) => (
              <div key={exp.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{exp.title}</h3>
                    <p className="text-gray-600">
                      {exp.company} • {exp.location}
                    </p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.endDate}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditItem({ section: "experience", isNew: false, data: exp })}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeItem("experience", exp.id)}
                      className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "education" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Education</h2>
            <button
              onClick={() =>
                setEditItem({
                  section: "education",
                  isNew: true,
                  data: {
                    degree: "",
                    institution: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  },
                })
              }
              className="flex items-center px-3 py-1 rounded-md text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add Education</span>
            </button>
          </div>

          {editItem && editItem.section === "education" && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">{editItem.isNew ? "Add New Education" : "Edit Education"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={editItem.data.degree}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, degree: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={editItem.data.institution}
                    onChange={(e) =>
                      setEditItem({ ...editItem, data: { ...editItem.data, institution: e.target.value } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editItem.data.location}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, location: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="text"
                      value={editItem.data.startDate}
                      onChange={(e) =>
                        setEditItem({ ...editItem, data: { ...editItem.data, startDate: e.target.value } })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2015"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="text"
                      value={editItem.data.endDate}
                      onChange={(e) =>
                        setEditItem({ ...editItem, data: { ...editItem.data, endDate: e.target.value } })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2019"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editItem.data.description}
                  onChange={(e) =>
                    setEditItem({ ...editItem, data: { ...editItem.data, description: e.target.value } })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your studies, achievements, etc..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditItem(null)}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editItem.isNew) {
                      addItem("education", editItem.data)
                    } else {
                      updateItem("education", editItem.data.id, editItem.data)
                    }
                    setEditItem(null)
                  }}
                  className="px-3 py-1 rounded-md text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {editItem.isNew ? "Add" : "Update"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-gray-600">
                      {edu.institution} • {edu.location}
                    </p>
                    <p className="text-sm text-gray-500">
                      {edu.startDate} - {edu.endDate}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditItem({ section: "education", isNew: false, data: edu })}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeItem("education", edu.id)}
                      className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm">{edu.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "skills" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Skills</h2>
          <p className="text-sm text-gray-600 mb-3">
            Add relevant skills that showcase your expertise with proficiency levels.
          </p>

          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Add New Skill</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JavaScript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {skillLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="text"
                  value={newSkill.years}
                  onChange={(e) => setNewSkill({ ...newSkill, years: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addSkill}
                className="px-3 py-1 rounded-md text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Add Skill
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Your Skills</h3>
            {resumeData.skills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Skill:</span>
                    <span className="ml-2">{skill.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Level:</span>
                    <select
                      value={skill.level}
                      onChange={(e) => updateSkill(index, "level", e.target.value)}
                      className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      {skillLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Years:</span>
                    <input
                      type="text"
                      value={skill.years}
                      onChange={(e) => updateSkill(index, "years", e.target.value)}
                      className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeSkill(skill.name)}
                  className="ml-2 p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "languages" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Languages</h2>
          <p className="text-sm text-gray-600 mb-3">Add languages you speak and your fluency level.</p>

          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Add New Language</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input
                  type="text"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Spanish"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fluency Level</label>
                <select
                  value={newLanguage.fluency}
                  onChange={(e) => setNewLanguage({ ...newLanguage, fluency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fluencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                <input
                  type="text"
                  value={newLanguage.details}
                  onChange={(e) => setNewLanguage({ ...newLanguage, details: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Conversational proficiency"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addLanguage}
                className="px-3 py-1 rounded-md text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Add Language
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Your Languages</h3>
            {resumeData.languages.map((language, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Language:</span>
                    <span className="ml-2">{language.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Fluency:</span>
                    <select
                      value={language.fluency}
                      onChange={(e) => updateLanguage(index, "fluency", e.target.value)}
                      className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      {fluencyLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Details:</span>
                    <input
                      type="text"
                      value={language.details}
                      onChange={(e) => updateLanguage(index, "details", e.target.value)}
                      className="ml-2 w-40 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeLanguage(language.name)}
                  className="ml-2 p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "certifications" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Certifications</h2>
            <button
              onClick={() =>
                setEditItem({
                  section: "certifications",
                  isNew: true,
                  data: {
                    name: "",
                    issuer: "",
                    date: "",
                    expiration: "",
                    credentialID: "",
                  },
                })
              }
              className="flex items-center px-3 py-1 rounded-md text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add Certification</span>
            </button>
          </div>

          {editItem && editItem.section === "certifications" && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                {editItem.isNew ? "Add New Certification" : "Edit Certification"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
                  <input
                    type="text"
                    value={editItem.data.name}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, name: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    value={editItem.data.issuer}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, issuer: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="text"
                    value={editItem.data.date}
                    onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, date: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2022"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
                  <input
                    type="text"
                    value={editItem.data.expiration || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, data: { ...editItem.data, expiration: e.target.value } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID (Optional)</label>
                  <input
                    type="text"
                    value={editItem.data.credentialID || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, data: { ...editItem.data, credentialID: e.target.value } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ABC-123456"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditItem(null)}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editItem.isNew) {
                      addItem("certifications", editItem.data)
                    } else {
                      updateItem("certifications", editItem.data.id, editItem.data)
                    }
                    setEditItem(null)
                  }}
                  className="px-3 py-1 rounded-md text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {editItem.isNew ? "Add" : "Update"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {resumeData.certifications.map((cert) => (
              <div key={cert.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{cert.name}</h3>
                    <p className="text-gray-600">{cert.issuer}</p>
                    <p className="text-sm text-gray-500">
                      Issued: {cert.date}
                      {cert.expiration && ` • Expires: ${cert.expiration}`}
                    </p>
                    {cert.credentialID && <p className="text-sm text-gray-500">ID: {cert.credentialID}</p>}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditItem({ section: "certifications", isNew: false, data: cert })}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeItem("certifications", cert.id)}
                      className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Render the preview panel
  const renderPreviewPanel = () => (
    <div className="h-full overflow-y-auto bg-white shadow-lg rounded-lg p-6" ref={previewRef}>
      {/* Preview based on selected template */}
      {activeTemplate.id === "modern" && (
        <div className="font-sans" id="preview-content">
          <div
            id="preview-personalInfo"
            className="flex flex-col md:flex-row justify-between items-start mb-6 pb-6 border-b"
            style={{ borderColor: primaryColor }}
          >
            <div>
              <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
                {resumeData.personalInfo.name}
              </h1>
              <p className="text-xl text-gray-600">{resumeData.personalInfo.title}</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <p>{resumeData.personalInfo.email}</p>
              <p>{resumeData.personalInfo.phone}</p>
              <p>{resumeData.personalInfo.location}</p>
              <div className="flex space-x-3 mt-2 justify-end">
                {resumeData.personalInfo.website && <Link className="h-4 w-4" style={{ color: primaryColor }} />}
              </div>
            </div>
          </div>

          <div id="preview-summary" className="mb-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
              SUMMARY
            </h2>
            <p>{resumeData.summary}</p>
          </div>

          <div id="preview-experience" className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
              EXPERIENCE
            </h2>
            <div className="space-y-4">
              {resumeData.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{exp.title}</h3>
                    <span className="text-gray-600">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    {exp.company} • {exp.location}
                  </p>
                  <p className="mt-1 text-sm">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="preview-education" className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
              EDUCATION
            </h2>
            <div className="space-y-4">
              {resumeData.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <span className="text-gray-600">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    {edu.institution} • {edu.location}
                  </p>
                  <p className="mt-1 text-sm">{edu.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="preview-skills">
              <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
                SKILLS
              </h2>
              <div className="space-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 mr-2">
                        {skill.level} ({skill.years} yrs)
                      </span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: primaryColor,
                            width:
                              skill.level === "Beginner"
                                ? "25%"
                                : skill.level === "Intermediate"
                                  ? "50%"
                                  : skill.level === "Advanced"
                                    ? "75%"
                                    : "100%",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="preview-languages">
              <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
                LANGUAGES
              </h2>
              <div className="space-y-2">
                {resumeData.languages.map((language, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{language.name}</span>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 mr-2">{language.fluency}</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: primaryColor,
                            width:
                              language.fluency === "Basic"
                                ? "25%"
                                : language.fluency === "Intermediate"
                                  ? "50%"
                                  : language.fluency === "Advanced"
                                    ? "75%"
                                    : language.fluency === "Fluent" || language.fluency === "Professional"
                                      ? "90%"
                                      : "100%",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="preview-certifications" className="mt-6">
            <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
              CERTIFICATIONS
            </h2>
            <div className="space-y-2">
              {resumeData.certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{cert.name}</span>
                    {cert.credentialID && <span className="text-xs text-gray-500 ml-2">ID: {cert.credentialID}</span>}
                  </div>
                  <span className="text-gray-600">
                    {cert.issuer}, {cert.date}
                    {cert.expiration && ` (Expires: ${cert.expiration})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTemplate.id === "classic" && (
        <div className="font-serif" id="preview-content">
          <div id="preview-personalInfo" className="text-center mb-6 pb-4 border-b-2">
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-1">{resumeData.personalInfo.name}</h1>
            <p className="text-xl text-gray-600">{resumeData.personalInfo.title}</p>
            <div className="flex justify-center space-x-4 mt-2 text-sm">
              <span>{resumeData.personalInfo.email}</span>
              <span>•</span>
              <span>{resumeData.personalInfo.phone}</span>
              <span>•</span>
              <span>{resumeData.personalInfo.location}</span>
            </div>
          </div>

          <div id="preview-summary" className="mb-6">
            <h2 className="text-xl font-bold uppercase mb-2 border-b" style={{ borderColor: primaryColor }}>
              Professional Summary
            </h2>
            <p className="mt-2">{resumeData.summary}</p>
          </div>

          <div id="preview-experience" className="mb-6">
            <h2 className="text-xl font-bold uppercase mb-2 border-b" style={{ borderColor: primaryColor }}>
              Experience
            </h2>
            <div className="space-y-4 mt-3">
              {resumeData.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold">{exp.title}</h3>
                    <span className="text-gray-600 text-sm">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <p className="font-semibold">
                    {exp.company}, {exp.location}
                  </p>
                  <p className="mt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="preview-education" className="mb-6">
            <h2 className="text-xl font-bold uppercase mb-2 border-b" style={{ borderColor: primaryColor }}>
              Education
            </h2>
            <div className="space-y-4 mt-3">
              {resumeData.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold">{edu.degree}</h3>
                    <span className="text-gray-600 text-sm">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p className="font-semibold">
                    {edu.institution}, {edu.location}
                  </p>
                  <p className="mt-1">{edu.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="preview-skills">
              <h2 className="text-xl font-bold uppercase mb-2 border-b" style={{ borderColor: primaryColor }}>
                Skills
              </h2>
              <table className="w-full mt-2">
                <tbody>
                  {resumeData.skills.map((skill, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-1 font-medium">{skill.name}</td>
                      <td className="py-1 text-right">
                        {skill.level} • {skill.years} years
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div id="preview-languages">
                <h2 className="text-xl font-bold uppercase mb-2 border-b" style={{ borderColor: primaryColor }}>
                  Languages
                </h2>
                <table className="w-full mt-2">
                  <tbody>
                    {resumeData.languages.map((language, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="py-1 font-medium">{language.name}</td>
                        <td className="py-1 text-right">{language.fluency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div id="preview-certifications" className="mt-4">
                <h2 className="text-xl font-bold uppercase mb-2 border-b" style={{ borderColor: primaryColor }}>
                  Certifications
                </h2>
                <ul className="list-disc list-inside mt-2">
                  {resumeData.certifications.map((cert) => (
                    <li key={cert.id} className="mb-1">
                      <span className="font-medium">{cert.name}</span> - {cert.issuer}, {cert.date}
                      {cert.expiration && <span className="text-sm text-gray-600"> (Expires: {cert.expiration})</span>}
                      {cert.credentialID && <div className="text-sm text-gray-600 ml-4">ID: {cert.credentialID}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTemplate.id === "minimal" && (
        <div className="font-sans" id="preview-content">
          <div id="preview-personalInfo" className="mb-6">
            <h1 className="text-3xl font-bold mb-1">{resumeData.personalInfo.name}</h1>
            <p className="text-lg" style={{ color: primaryColor }}>
              {resumeData.personalInfo.title}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
              <span>{resumeData.personalInfo.email}</span>
              <span>{resumeData.personalInfo.phone}</span>
              <span>{resumeData.personalInfo.location}</span>
              {resumeData.personalInfo.website && <span>{resumeData.personalInfo.website}</span>}
            </div>
          </div>

          <div id="preview-summary" className="mb-6">
            <p>{resumeData.summary}</p>
          </div>

          <div id="preview-experience" className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
              Experience
            </h2>
            <div className="space-y-4">
              {resumeData.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold">
                      {exp.title} @ {exp.company}
                    </h3>
                    <span className="text-gray-600 text-sm">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{exp.location}</p>
                  <p className="text-sm">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="preview-education" className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
              Education
            </h2>
            <div className="space-y-4">
              {resumeData.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <span className="text-gray-600 text-sm">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {edu.institution}, {edu.location}
                  </p>
                  <p className="text-sm">{edu.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div id="preview-skills">
              <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
                Skills
              </h2>
              <div className="text-sm">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="mb-1">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-gray-600">
                      {" "}
                      ({skill.level}, {skill.years} yrs)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div id="preview-languages">
              <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
                Languages
              </h2>
              <div className="text-sm">
                {resumeData.languages.map((language, index) => (
                  <div key={index} className="mb-1">
                    <span className="font-medium">{language.name}</span>
                    <span className="text-gray-600"> ({language.fluency})</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="preview-certifications">
              <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>
                Certifications
              </h2>
              <div className="text-sm">
                {resumeData.certifications.map((cert) => (
                  <div key={cert.id} className="mb-2">
                    <div className="font-medium">{cert.name}</div>
                    <div className="text-gray-600">
                      {cert.issuer}, {cert.date}
                    </div>
                    {cert.credentialID && <div className="text-gray-500">ID: {cert.credentialID}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTemplate.id === "professional" && (
        <div className="font-sans" id="preview-content">
          <div
            id="preview-personalInfo"
            className="flex flex-col md:flex-row justify-between items-start mb-6 pb-4 border-b-2"
            style={{ borderColor: primaryColor }}
          >
            <div>
              <h1 className="text-3xl font-bold mb-1">{resumeData.personalInfo.name}</h1>
              <p className="text-xl mb-2">{resumeData.personalInfo.title}</p>
              <p className="text-sm">{resumeData.summary}</p>
            </div>
            <div className="mt-4 md:mt-0 md:text-right">
              <p>{resumeData.personalInfo.email}</p>
              <p>{resumeData.personalInfo.phone}</p>
              <p>{resumeData.personalInfo.location}</p>
              {resumeData.personalInfo.website && <p>{resumeData.personalInfo.website}</p>}
              {resumeData.personalInfo.linkedin && <p>{resumeData.personalInfo.linkedin}</p>}
            </div>
          </div>

          <div id="preview-experience" className="mb-6">
            <div className="flex items-center mb-3">
              <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
                Professional Experience
              </h2>
              <div className="flex-grow ml-3 h-0.5" style={{ backgroundColor: primaryColor }}></div>
            </div>
            <div className="space-y-5">
              {resumeData.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-lg">{exp.title}</h3>
                    <span className="text-gray-600">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <p className="font-medium text-gray-700">
                    {exp.company} | {exp.location}
                  </p>
                  <p className="mt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="preview-education" className="mb-6">
            <div className="flex items-center mb-3">
              <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
                Education
              </h2>
              <div className="flex-grow ml-3 h-0.5" style={{ backgroundColor: primaryColor }}></div>
            </div>
            <div className="space-y-5">
              {resumeData.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-lg">{edu.degree}</h3>
                    <span className="text-gray-600">
                      {edu.startDate} - {edu.endDate}
                    </span>
                  </div>
                  <p className="font-medium text-gray-700">
                    {edu.institution} | {edu.location}
                  </p>
                  <p className="mt-1">{edu.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="preview-skills">
              <div className="flex items-center mb-3">
                <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
                  Skills
                </h2>
                <div className="flex-grow ml-3 h-0.5" style={{ backgroundColor: primaryColor }}></div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-sm text-gray-600">{skill.level}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: primaryColor,
                          width:
                            skill.level === "Beginner"
                              ? "25%"
                              : skill.level === "Intermediate"
                                ? "50%"
                                : skill.level === "Advanced"
                                  ? "75%"
                                  : "100%",
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">{skill.years} years</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="preview-languages">
              <div className="flex items-center mb-3">
                <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
                  Languages
                </h2>
                <div className="flex-grow ml-3 h-0.5" style={{ backgroundColor: primaryColor }}></div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {resumeData.languages.map((language, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="font-medium">{language.name}</span>
                      <span className="text-sm text-gray-600">{language.fluency}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: primaryColor,
                          width:
                            language.fluency === "Basic"
                              ? "25%"
                              : language.fluency === "Intermediate"
                                ? "50%"
                                : language.fluency === "Advanced"
                                  ? "75%"
                                  : language.fluency === "Fluent" || language.fluency === "Professional"
                                    ? "90%"
                                    : "100%",
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">{language.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="preview-certifications" className="mt-6">
            <div className="flex items-center mb-3">
              <h2 className="text-xl font-bold" style={{ color: primaryColor }}>
                Certifications
              </h2>
              <div className="flex-grow ml-3 h-0.5" style={{ backgroundColor: primaryColor }}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumeData.certifications.map((cert) => (
                <div key={cert.id} className="border-l-2 pl-3" style={{ borderColor: primaryColor }}>
                  <div className="font-medium">{cert.name}</div>
                  <div className="text-sm text-gray-700">
                    {cert.issuer}, {cert.date}
                  </div>
                  {cert.expiration && <div className="text-xs text-gray-600">Expires: {cert.expiration}</div>}
                  {cert.credentialID && <div className="text-xs text-gray-600">ID: {cert.credentialID}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <FileText className="h-6 w-6 mr-2" style={{ color: primaryColor }} />
          <h1 className="text-xl font-bold">ATS Resume Builder</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={toggleSplitView}
            className="flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {splitView === "horizontal" ? (
              <>
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Horizontal Split</span>
              </>
            ) : splitView === "vertical" ? (
              <>
                <ArrowLeftRight className="h-4 w-4 mr-1 rotate-90" />
                <span className="hidden md:inline">Vertical Split</span>
              </>
            ) : splitView === "editor-only" ? (
              <>
                <Edit className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Editor Only</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Preview Only</span>
              </>
            )}
          </button>
          <div className="relative download-menu-container">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              <span>Download</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button onClick={downloadAsPDF} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                    PDF Format
                  </button>
                  <button onClick={downloadAsDOCX} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                    Word Document (DOCX)
                  </button>
                  <button onClick={downloadAsTXT} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                    Plain Text (TXT)
                  </button>
                  <button onClick={exportToOverleaf} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                    Export to Overleaf
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className="flex items-center px-3 py-2 rounded-md text-white transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="h-4 w-4 mr-1" />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {splitView !== "preview-only" && (
          <div className="w-1/4 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Templates</h2>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateChange(template)}
                    className={`cursor-pointer p-3 rounded-md border-2 transition-all ${activeTemplate.id === template.id ? "border-blue-500 shadow-sm" : "border-gray-200"}`}
                  >
                    <div
                      className="h-20 mb-2 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: template.color + "20" }}
                    >
                      <Layout className="h-8 w-8" style={{ color: template.color }} />
                    </div>
                    <p className="text-center text-sm font-medium">{template.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Color</h2>
              <div className="flex space-x-2">
                {["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"].map((color) => (
                  <div
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`h-8 w-8 rounded-full cursor-pointer transition-all ${primaryColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Sections</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSection("personalInfo")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "personalInfo" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <User className="h-4 w-4 mr-2" />
                  <span>Personal Information</span>
                </button>
                <button
                  onClick={() => setActiveSection("summary")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "summary" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Professional Summary</span>
                </button>
                <button
                  onClick={() => setActiveSection("experience")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "experience" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>Work Experience</span>
                </button>
                <button
                  onClick={() => setActiveSection("education")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "education" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <span>Education</span>
                </button>
                <button
                  onClick={() => setActiveSection("skills")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "skills" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <Code className="h-4 w-4 mr-2" />
                  <span>Skills</span>
                </button>
                <button
                  onClick={() => setActiveSection("languages")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "languages" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <Languages className="h-4 w-4 mr-2" />
                  <span>Languages</span>
                </button>
                <button
                  onClick={() => setActiveSection("certifications")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeSection === "certifications" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <Award className="h-4 w-4 mr-2" />
                  <span>Certifications</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Split View Content */}
        <div className="flex-1 flex relative">
          {/* Split view layout based on the current mode */}
          {splitView === "horizontal" && (
            <>
              <div className="w-1/2 h-full" style={{ width: `${splitRatio}%` }}>
                {renderEditorPanel()}
              </div>
              <div
                ref={splitDivRef}
                className="w-1 h-full bg-gray-200 hover:bg-gray-400 cursor-col-resize"
                onMouseDown={handleMouseDown}
              />
              <div className="h-full" style={{ width: `${100 - splitRatio}%` }}>
                {renderPreviewPanel()}
              </div>
            </>
          )}

          {splitView === "vertical" && (
            <>
              <div className="w-full h-1/2" style={{ height: `${splitRatio}%` }}>
                {renderEditorPanel()}
              </div>
              <div
                ref={splitDivRef}
                className="w-full h-1 bg-gray-200 hover:bg-gray-400 cursor-row-resize"
                onMouseDown={handleMouseDown}
              />
              <div className="w-full" style={{ height: `${100 - splitRatio}%` }}>
                {renderPreviewPanel()}
              </div>
            </>
          )}

          {splitView === "editor-only" && <div className="w-full h-full">{renderEditorPanel()}</div>}

          {splitView === "preview-only" && <div className="w-full h-full">{renderPreviewPanel()}</div>}
        </div>
      </main>
    </div>
  )
}
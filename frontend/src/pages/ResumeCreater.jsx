"use client"

import { useRef } from "react"
import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Download, Plus, Trash2, Move, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap } from "lucide-react"
import { usePDF } from "react-to-pdf"
import "./ResumeCreater.css"

// Enhanced resume templates with more detailed styling
const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    color: "#3b82f6",
    fontFamily: "'Inter', sans-serif",
    headerStyle: "border-b-2 pb-2",
    sectionHeaderStyle: "text-lg font-medium mb-3",
    personalStyle: "text-center mb-6",
    skillStyle: "inline-block px-2 py-1 rounded-md mr-2 mb-2",
    experienceStyle: "mb-4 pb-4",
    educationStyle: "mb-4",
  },
  {
    id: "professional",
    name: "Professional",
    color: "#10b981",
    fontFamily: "'Roboto', sans-serif",
    headerStyle: "uppercase tracking-wider border-b-2 pb-2",
    sectionHeaderStyle: "text-lg font-bold uppercase tracking-wide mb-4",
    personalStyle: "flex flex-col items-start mb-8 border-l-4 pl-4",
    skillStyle: "inline-block px-3 py-1 rounded-full mr-2 mb-2 font-medium",
    experienceStyle: "mb-5 pb-5 border-b border-gray-200",
    educationStyle: "mb-4 flex justify-between items-start",
  },
  {
    id: "creative",
    name: "Creative",
    color: "#8b5cf6",
    fontFamily: "'Poppins', sans-serif",
    headerStyle:
      "relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:rounded-full",
    sectionHeaderStyle: "text-xl font-bold mb-4 inline-block relative",
    personalStyle: "relative mb-10 pb-6",
    skillStyle: "inline-block px-3 py-1 rounded-lg mr-2 mb-2 shadow-sm",
    experienceStyle:
      "mb-6 pb-6 relative pl-6 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-full",
    educationStyle:
      "mb-5 relative pl-6 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-full",
  },
]

// Sample resume sections
const initialSections = [
  {
    id: "personal",
    title: "Personal Information",
    content: {
      name: "John Doe",
      title: "Software Developer",
      email: "john.doe@example.com",
      phone: "(123) 456-7890",
      location: "New York, NY",
    },
    type: "personal",
  },
  {
    id: "summary",
    title: "Professional Summary",
    content: "Experienced software developer with a passion for creating efficient, scalable applications.",
    type: "text",
  },
  {
    id: "experience",
    title: "Work Experience",
    content: [
      {
        id: "exp1",
        role: "Senior Developer",
        company: "Tech Solutions Inc.",
        period: "2020 - Present",
        description: "Led development of enterprise applications using React and Node.js.",
      },
      {
        id: "exp2",
        role: "Web Developer",
        company: "Digital Creations",
        period: "2018 - 2020",
        description: "Developed responsive web applications for various clients.",
      },
    ],
    type: "list",
  },
  {
    id: "education",
    title: "Education",
    content: [
      {
        id: "edu1",
        degree: "Bachelor of Science in Computer Science",
        institution: "University of Technology",
        year: "2018",
      },
    ],
    type: "list",
  },
  {
    id: "projects",
    title: "Projects",
    content: [
      {
        id: "proj1",
        name: "Project Name",
        description: "Brief description of the project and your role.",
        technologies: "Technologies used",
        link: "https://project-link.com",
      },
    ],
    type: "list",
  },
  {
    id: "skills",
    title: "Skills",
    content: ["JavaScript", "React", "Node.js", "HTML/CSS", "Git", "Agile Methodologies"],
    type: "tags",
  },
]

function ResumeCreater() {
  const [sections, setSections] = useState(initialSections)
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0])
  const [editingSection, setEditingSection] = useState(null)

  // Reference for PDF generation
  const pdfRef = useRef()
  const { toPDF, targetRef } = usePDF({
    filename: "resume.pdf",
    options: {
      // Ensure proper rendering of background colors and styles
      scale: 1,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    },
  })

  // Handle drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(sections)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSections(items)
  }

  // Add a new section
  const addSection = (type) => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      content: type === "text" ? "Click to edit this section" : type === "list" ? [] : type === "tags" ? [] : {},
      type,
    }

    setSections([...sections, newSection])
  }

  // Remove a section
  const removeSection = (id) => {
    setSections(sections.filter((section) => section.id !== id))
  }

  // Update section content
  const updateSection = (id, updatedContent) => {
    setSections(sections.map((section) => (section.id === id ? { ...section, ...updatedContent } : section)))
  }

  // Get template-specific styles
  const getTemplateStyles = (sectionType) => {
    switch (sectionType) {
      case "header":
        return activeTemplate.headerStyle
      case "sectionHeader":
        return activeTemplate.sectionHeaderStyle
      case "personal":
        return activeTemplate.personalStyle
      case "skill":
        return activeTemplate.skillStyle
      case "experience":
        return activeTemplate.experienceStyle
      case "education":
        return activeTemplate.educationStyle
      default:
        return ""
    }
  }

  // Render personal info based on template
  const renderPersonalInfo = (section) => {
    switch (activeTemplate.id) {
      case "minimal":
        return (
          <div className={`personal-info ${getTemplateStyles("personal")}`}>
            <h1
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                updateSection(section.id, {
                  content: { ...section.content, name: e.target.textContent },
                })
              }
            >
              {section.content.name}
            </h1>
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                updateSection(section.id, {
                  content: { ...section.content, title: e.target.textContent },
                })
              }
            >
              {section.content.title}
            </h2>
            <div className="contact-info">
              <span className="flex items-center">
                <Mail size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, email: e.target.textContent },
                    })
                  }
                >
                  {section.content.email}
                </span>
              </span>
              <span className="flex items-center">
                <Phone size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, phone: e.target.textContent },
                    })
                  }
                >
                  {section.content.phone}
                </span>
              </span>
              <span className="flex items-center">
                <MapPin size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, location: e.target.textContent },
                    })
                  }
                >
                  {section.content.location}
                </span>
              </span>
            </div>
          </div>
        )

      case "professional":
        return (
          <div
            className={`personal-info ${getTemplateStyles("personal")}`}
            style={{ borderLeftColor: activeTemplate.color }}
          >
            <h1
              contentEditable
              suppressContentEditableWarning
              className="text-3xl font-bold mb-1"
              onBlur={(e) =>
                updateSection(section.id, {
                  content: { ...section.content, name: e.target.textContent },
                })
              }
            >
              {section.content.name}
            </h1>
            <h2
              contentEditable
              suppressContentEditableWarning
              className="text-xl font-medium mb-4"
              style={{ color: activeTemplate.color }}
              onBlur={(e) =>
                updateSection(section.id, {
                  content: { ...section.content, title: e.target.textContent },
                })
              }
            >
              {section.content.title}
            </h2>
            <div className="contact-info grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center">
                <Mail size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, email: e.target.textContent },
                    })
                  }
                >
                  {section.content.email}
                </span>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, phone: e.target.textContent },
                    })
                  }
                >
                  {section.content.phone}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, location: e.target.textContent },
                    })
                  }
                >
                  {section.content.location}
                </span>
              </div>
            </div>
          </div>
        )

      case "creative":
        return (
          <div className={`personal-info ${getTemplateStyles("personal")}`}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  className="text-4xl font-bold mb-2 relative"
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, name: e.target.textContent },
                    })
                  }
                >
                  {section.content.name}
                  <span
                    className="absolute -bottom-2 left-0 w-12 h-1 rounded-full"
                    style={{ backgroundColor: activeTemplate.color }}
                  ></span>
                </h1>
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  className="text-xl font-medium mt-4"
                  style={{ color: activeTemplate.color }}
                  onBlur={(e) =>
                    updateSection(section.id, {
                      content: { ...section.content, title: e.target.textContent },
                    })
                  }
                >
                  {section.content.title}
                </h2>
              </div>
              <div className="contact-info mt-4 md:mt-0 flex flex-wrap gap-3 md:gap-4">
                <div
                  className="flex items-center bg-opacity-10 px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${activeTemplate.color}20` }}
                >
                  <Mail size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateSection(section.id, {
                        content: { ...section.content, email: e.target.textContent },
                      })
                    }
                  >
                    {section.content.email}
                  </span>
                </div>
                <div
                  className="flex items-center bg-opacity-10 px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${activeTemplate.color}20` }}
                >
                  <Phone size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateSection(section.id, {
                        content: { ...section.content, phone: e.target.textContent },
                      })
                    }
                  >
                    {section.content.phone}
                  </span>
                </div>
                <div
                  className="flex items-center bg-opacity-10 px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${activeTemplate.color}20` }}
                >
                  <MapPin size={16} className="mr-2" style={{ color: activeTemplate.color }} />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateSection(section.id, {
                        content: { ...section.content, location: e.target.textContent },
                      })
                    }
                  >
                    {section.content.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render experience items based on template
  const renderExperienceItem = (section, item, i) => {
    switch (activeTemplate.id) {
      case "minimal":
        return (
          <div key={item.id} className={`experience-item ${getTemplateStyles("experience")}`}>
            <div className="experience-header">
              <h4
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], role: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.role}
              </h4>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], period: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.period}
              </span>
            </div>
            <h5
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], company: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.company}
            </h5>
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], description: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.description}
            </p>
          </div>
        )

      case "professional":
        return (
          <div key={item.id} className={`experience-item ${getTemplateStyles("experience")}`}>
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <Briefcase size={18} style={{ color: activeTemplate.color }} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                  <h4
                    contentEditable
                    suppressContentEditableWarning
                    className="text-lg font-bold"
                    onBlur={(e) => {
                      const newContent = [...section.content]
                      newContent[i] = { ...newContent[i], role: e.target.textContent }
                      updateSection(section.id, { content: newContent })
                    }}
                  >
                    {item.role}
                  </h4>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    className="text-sm font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: `${activeTemplate.color}20`, color: activeTemplate.color }}
                    onBlur={(e) => {
                      const newContent = [...section.content]
                      newContent[i] = { ...newContent[i], period: e.target.textContent }
                      updateSection(section.id, { content: newContent })
                    }}
                  >
                    {item.period}
                  </span>
                </div>
                <h5
                  contentEditable
                  suppressContentEditableWarning
                  className="text-base font-medium mb-2"
                  onBlur={(e) => {
                    const newContent = [...section.content]
                    newContent[i] = { ...newContent[i], company: e.target.textContent }
                    updateSection(section.id, { content: newContent })
                  }}
                >
                  {item.company}
                </h5>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  className="text-sm"
                  onBlur={(e) => {
                    const newContent = [...section.content]
                    newContent[i] = { ...newContent[i], description: e.target.textContent }
                    updateSection(section.id, { content: newContent })
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        )

      case "creative":
        return (
          <div
            key={item.id}
            className={`experience-item ${getTemplateStyles("experience")}`}
            style={{
              beforeBackgroundColor: activeTemplate.color,
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h4
                contentEditable
                suppressContentEditableWarning
                className="text-lg font-bold"
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], role: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.role}
              </h4>
              <div className="flex items-center mt-1 md:mt-0">
                <Calendar size={14} className="mr-1" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="text-sm"
                  onBlur={(e) => {
                    const newContent = [...section.content]
                    newContent[i] = { ...newContent[i], period: e.target.textContent }
                    updateSection(section.id, { content: newContent })
                  }}
                >
                  {item.period}
                </span>
              </div>
            </div>
            <h5
              contentEditable
              suppressContentEditableWarning
              className="text-base font-medium mb-2"
              style={{ color: activeTemplate.color }}
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], company: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.company}
            </h5>
            <p
              contentEditable
              suppressContentEditableWarning
              className="text-sm"
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], description: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.description}
            </p>
          </div>
        )

      default:
        return null
    }
  }

  // Render education items based on template
  const renderEducationItem = (section, item, i) => {
    switch (activeTemplate.id) {
      case "minimal":
        return (
          <div key={item.id} className={`education-item ${getTemplateStyles("education")}`}>
            <div className="education-header">
              <h4
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], degree: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.degree}
              </h4>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], year: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.year}
              </span>
            </div>
            <h5
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], institution: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.institution}
            </h5>
          </div>
        )

      case "professional":
        return (
          <div key={item.id} className={`education-item ${getTemplateStyles("education")}`}>
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <GraduationCap size={18} style={{ color: activeTemplate.color }} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                  <h4
                    contentEditable
                    suppressContentEditableWarning
                    className="text-lg font-bold"
                    onBlur={(e) => {
                      const newContent = [...section.content]
                      newContent[i] = { ...newContent[i], degree: e.target.textContent }
                      updateSection(section.id, { content: newContent })
                    }}
                  >
                    {item.degree}
                  </h4>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    className="text-sm font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: `${activeTemplate.color}20`, color: activeTemplate.color }}
                    onBlur={(e) => {
                      const newContent = [...section.content]
                      newContent[i] = { ...newContent[i], year: e.target.textContent }
                      updateSection(section.id, { content: newContent })
                    }}
                  >
                    {item.year}
                  </span>
                </div>
                <h5
                  contentEditable
                  suppressContentEditableWarning
                  className="text-base font-medium"
                  onBlur={(e) => {
                    const newContent = [...section.content]
                    newContent[i] = { ...newContent[i], institution: e.target.textContent }
                    updateSection(section.id, { content: newContent })
                  }}
                >
                  {item.institution}
                </h5>
              </div>
            </div>
          </div>
        )

      case "creative":
        return (
          <div
            key={item.id}
            className={`education-item ${getTemplateStyles("education")}`}
            style={{
              beforeBackgroundColor: activeTemplate.color,
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h4
                contentEditable
                suppressContentEditableWarning
                className="text-lg font-bold"
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], degree: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.degree}
              </h4>
              <div className="flex items-center mt-1 md:mt-0">
                <Calendar size={14} className="mr-1" style={{ color: activeTemplate.color }} />
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="text-sm"
                  onBlur={(e) => {
                    const newContent = [...section.content]
                    newContent[i] = { ...newContent[i], year: e.target.textContent }
                    updateSection(section.id, { content: newContent })
                  }}
                >
                  {item.year}
                </span>
              </div>
            </div>
            <h5
              contentEditable
              suppressContentEditableWarning
              className="text-base font-medium"
              style={{ color: activeTemplate.color }}
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], institution: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.institution}
            </h5>
          </div>
        )

      default:
        return null
    }
  }

  // Render project items based on template
  const renderProjectItem = (section, item, i) => {
    switch (activeTemplate.id) {
      case "minimal":
        return (
          <div key={item.id} className={`project-item ${getTemplateStyles("experience")}`}>
            <div className="project-header">
              <h4
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], name: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.name}
              </h4>
              <span
                contentEditable
                suppressContentEditableWarning
                className="project-link"
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], link: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.link}
              </span>
            </div>
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], description: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.description}
            </p>
            <div
              contentEditable
              suppressContentEditableWarning
              className="project-tech"
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], technologies: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.technologies}
            </div>
          </div>
        )

      case "professional":
        return (
          <div key={item.id} className={`project-item ${getTemplateStyles("experience")}`}>
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <Briefcase size={18} style={{ color: activeTemplate.color }} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                  <h4
                    contentEditable
                    suppressContentEditableWarning
                    className="text-lg font-bold"
                    onBlur={(e) => {
                      const newContent = [...section.content]
                      newContent[i] = { ...newContent[i], name: e.target.textContent }
                      updateSection(section.id, { content: newContent })
                    }}
                  >
                    {item.name}
                  </h4>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    contentEditable
                    suppressContentEditableWarning
                    className="text-sm font-medium text-blue-500 hover:underline"
                    onBlur={(e) => {
                      const newContent = [...section.content]
                      newContent[i] = { ...newContent[i], link: e.target.textContent }
                      updateSection(section.id, { content: newContent })
                    }}
                  >
                    {item.link}
                  </a>
                </div>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  className="text-sm mb-2"
                  onBlur={(e) => {
                    const newContent = [...section.content]
                    newContent[i] = { ...newContent[i], description: e.target.textContent }
                    updateSection(section.id, { content: newContent })
                  }}
                >
                  {item.description}
                </p>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="text-sm font-medium"
                  style={{ color: activeTemplate.color }}
                  onBlur={(e) => {
                    const newContent = [...section.content]
                    newContent[i] = { ...newContent[i], technologies: e.target.textContent }
                    updateSection(section.id, { content: newContent })
                  }}
                >
                  {item.technologies}
                </div>
              </div>
            </div>
          </div>
        )

      case "creative":
        return (
          <div
            key={item.id}
            className={`project-item ${getTemplateStyles("experience")}`}
            style={{
              beforeBackgroundColor: activeTemplate.color,
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h4
                contentEditable
                suppressContentEditableWarning
                className="text-lg font-bold"
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], name: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.name}
              </h4>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                contentEditable
                suppressContentEditableWarning
                className="text-sm hover:underline mt-1 md:mt-0"
                style={{ color: activeTemplate.color }}
                onBlur={(e) => {
                  const newContent = [...section.content]
                  newContent[i] = { ...newContent[i], link: e.target.textContent }
                  updateSection(section.id, { content: newContent })
                }}
              >
                {item.link}
              </a>
            </div>
            <p
              contentEditable
              suppressContentEditableWarning
              className="text-sm mb-2"
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], description: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.description}
            </p>
            <div
              contentEditable
              suppressContentEditableWarning
              className="text-sm font-medium"
              style={{ color: activeTemplate.color }}
              onBlur={(e) => {
                const newContent = [...section.content]
                newContent[i] = { ...newContent[i], technologies: e.target.textContent }
                updateSection(section.id, { content: newContent })
              }}
            >
              {item.technologies}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render skill tags based on template
  const renderSkillTag = (section, skill, i) => {
    return (
      <div
        key={i}
        className="skill-tag"
        style={{
          backgroundColor: `${activeTemplate.color}20`,
          color: activeTemplate.color,
          ...(activeTemplate.id === "creative" ? { boxShadow: "0 1px 2px rgba(0,0,0,0.1)" } : {}),
        }}
      >
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const newContent = [...section.content]
            newContent[i] = e.target.textContent
            updateSection(section.id, { content: newContent })
          }}
        >
          {skill}
        </span>
        <button
          onClick={() => {
            const newContent = [...section.content]
            newContent.splice(i, 1)
            updateSection(section.id, { content: newContent })
          }}
          className="remove-tag"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Resume Creator</h2>

        <div className="templates">
          <h3>Templates</h3>
          <div className="template-list">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`template-item ${activeTemplate.id === template.id ? "active" : ""}`}
                onClick={() => setActiveTemplate(template)}
                style={{ backgroundColor: template.color + "20" }}
              >
                <div className="color-preview" style={{ backgroundColor: template.color }}></div>
                <span>{template.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="add-section">
          <h3>Add Section</h3>
          <button onClick={() => addSection("text")}>
            <Plus size={16} /> Text Section
          </button>
          <button onClick={() => addSection("list")}>
            <Plus size={16} /> List Section
          </button>
          <button onClick={() => addSection("tags")}>
            <Plus size={16} /> Skills/Tags
          </button>
        </div>

        <button className="download-btn" onClick={() => toPDF()}>
          <Download size={16} /> Download PDF
        </button>
      </div>

      <div className="main-content">
        <div
          className="resume-container"
          ref={targetRef}
          style={{
            fontFamily: activeTemplate.fontFamily,
            "--primary-color": activeTemplate.color,
          }}
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="resume-sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="resume-sections">
                  {sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="resume-section">
                          <div className="section-header">
                            <h3
                              contentEditable
                              suppressContentEditableWarning
                              className={getTemplateStyles("sectionHeader")}
                              style={{ borderColor: activeTemplate.color, afterBackgroundColor: activeTemplate.color }}
                              onBlur={(e) => updateSection(section.id, { title: e.target.textContent })}
                            >
                              {section.title}
                            </h3>
                            <div className="section-controls">
                              <div {...provided.dragHandleProps} className="drag-handle">
                                <Move size={16} />
                              </div>
                              <button onClick={() => removeSection(section.id)} className="delete-btn">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="section-content">
                            {section.type === "personal" && renderPersonalInfo(section)}

                            {section.type === "text" && (
                              <p
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateSection(section.id, { content: e.target.textContent })}
                              >
                                {section.content}
                              </p>
                            )}

                            {section.type === "list" && section.id === "experience" && (
                              <div className="experience-list">
                                {section.content.map((item, i) => renderExperienceItem(section, item, i))}
                                <button
                                  className="add-item-btn"
                                  onClick={() => {
                                    const newContent = [...section.content]
                                    newContent.push({
                                      id: `exp-${Date.now()}`,
                                      role: "New Position",
                                      company: "Company Name",
                                      period: "Start - End",
                                      description: "Description of your responsibilities and achievements.",
                                    })
                                    updateSection(section.id, { content: newContent })
                                  }}
                                >
                                  <Plus size={16} /> Add Experience
                                </button>
                              </div>
                            )}

                            {section.type === "list" && section.id === "education" && (
                              <div className="education-list">
                                {section.content.map((item, i) => renderEducationItem(section, item, i))}
                                <button
                                  className="add-item-btn"
                                  onClick={() => {
                                    const newContent = [...section.content]
                                    newContent.push({
                                      id: `edu-${Date.now()}`,
                                      degree: "Degree Name",
                                      institution: "Institution Name",
                                      year: "Graduation Year",
                                    })
                                    updateSection(section.id, { content: newContent })
                                  }}
                                >
                                  <Plus size={16} /> Add Education
                                </button>
                              </div>
                            )}

                            {section.type === "list" && section.id === "projects" && (
                              <div className="projects-list">
                                {section.content.map((item, i) => renderProjectItem(section, item, i))}
                                <button
                                  className="add-item-btn"
                                  onClick={() => {
                                    const newContent = [...section.content]
                                    newContent.push({
                                      id: `proj-${Date.now()}`,
                                      name: "Project Name",
                                      description: "Brief description of the project and your role.",
                                      technologies: "Technologies used",
                                      link: "https://project-link.com",
                                    })
                                    updateSection(section.id, { content: newContent })
                                  }}
                                >
                                  <Plus size={16} /> Add Project
                                </button>
                              </div>
                            )}

                            {section.type === "tags" && (
                              <div className="skills-container">
                                <div className="skills-list">
                                  {section.content.map((skill, i) => renderSkillTag(section, skill, i))}
                                </div>
                                <div className="add-skill">
                                  <input
                                    type="text"
                                    placeholder="Add a skill..."
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && e.target.value.trim()) {
                                        const newContent = [...section.content, e.target.value.trim()]
                                        updateSection(section.id, { content: newContent })
                                        e.target.value = ""
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  )
}

export default ResumeCreater


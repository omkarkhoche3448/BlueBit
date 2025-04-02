import { useRef, useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Download, Plus, Trash2, Move, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap } from 'lucide-react'
import { usePDF } from "react-to-pdf"
import useProStatus from '../hooks/useProStatus'
import "./ResumeCreater.css"

// More professional resume templates with standard styling
const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    color: "#2563eb",
    fontFamily: "'Arial', sans-serif",
    headerStyle: "border-b-2 pb-2",
    sectionHeaderStyle: "text-lg font-bold mb-3",
    personalStyle: "mb-6",
    skillStyle: "inline-block px-2 py-1 rounded-md mr-2 mb-2",
    experienceStyle: "mb-4 pb-4",
    educationStyle: "mb-4",
  },
  {
    id: "modern",
    name: "Modern",
    color: "#0f766e",
    fontFamily: "'Helvetica', sans-serif",
    headerStyle: "border-b-2 pb-2",
    sectionHeaderStyle: "text-lg font-bold mb-3",
    personalStyle: "mb-6",
    skillStyle: "inline-block px-2 py-1 rounded-md mr-2 mb-2",
    experienceStyle: "mb-4 pb-4 border-b border-gray-200",
    educationStyle: "mb-4",
  },
  {
    id: "simple",
    name: "Simple",
    color: "#4b5563",
    fontFamily: "'Calibri', sans-serif",
    headerStyle: "border-b-2 pb-2",
    sectionHeaderStyle: "text-lg font-bold mb-3",
    personalStyle: "mb-6",
    skillStyle: "inline-block px-2 py-1 mr-2 mb-2",
    experienceStyle: "mb-4 pb-4",
    educationStyle: "mb-4",
  },
]

// Sample resume sections
const initialSections = [
  {
    id: "personal",
    title: "",
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

// Add isPro state at the beginning of the component
function ResumeCreator() {
  const [sections, setSections] = useState(initialSections)
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0])
  const [editingSection, setEditingSection] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const { isPro, isLoading, requirePro } = useProStatus()

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

  // Handle PDF generation
  // Modify the handleGeneratePDF function to use requirePro
  const handleGeneratePDF = requirePro(() => {
    setIsPrinting(true);
    setTimeout(() => {
      toPDF();
      setTimeout(() => {
        setIsPrinting(false);
      }, 1000);
    }, 100);
  });

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
    return (
      <div className={`personal-info ${getTemplateStyles("personal")}`}>
        <h1
          contentEditable
          suppressContentEditableWarning
          className="text-2xl font-bold mb-1"
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
          className="text-lg mb-3"
          style={{ color: activeTemplate.color }}
          onBlur={(e) =>
            updateSection(section.id, {
              content: { ...section.content, title: e.target.textContent },
            })
          }
        >
          {section.content.title}
        </h2>
        <div className="contact-info flex flex-wrap gap-4">
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
  }

  // Render experience items based on template
  const renderExperienceItem = (section, item, i) => {
    return (
      <div key={item.id} className={`experience-item ${getTemplateStyles("experience")}`}>
        <div className="flex justify-between items-baseline mb-1">
          <h4
            contentEditable
            suppressContentEditableWarning
            className="text-base font-bold"
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
        <h5
          contentEditable
          suppressContentEditableWarning
          className="text-base mb-1"
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
  }

  // Render education items based on template
  const renderEducationItem = (section, item, i) => {
    return (
      <div key={item.id} className={`education-item ${getTemplateStyles("education")}`}>
        <div className="flex justify-between items-baseline mb-1">
          <h4
            contentEditable
            suppressContentEditableWarning
            className="text-base font-bold"
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
        <h5
          contentEditable
          suppressContentEditableWarning
          className="text-base"
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
  }

  // Render project items based on template
  const renderProjectItem = (section, item, i) => {
    return (
      <div key={item.id} className={`project-item ${getTemplateStyles("experience")}`}>
        <div className="flex justify-between items-baseline mb-1">
          <h4
            contentEditable
            suppressContentEditableWarning
            className="text-base font-bold"
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
            className="text-sm hover:underline"
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
          className="text-sm mb-1"
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
          className="text-sm"
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
  }

  // Render skill tags based on template
  const renderSkillTag = (section, skill, i) => {
    return (
      <div
        key={i}
        className="skill-tag"
        style={{
          backgroundColor: `${activeTemplate.color}10`,
          color: activeTemplate.color,
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
        {!isPrinting && (
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
        )}
      </div>
    )
  }

  return (
    <div className="app-container">
      {!isPrinting && (
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
                  style={{ backgroundColor: template.color + "10" }}
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

          <div className="download-section">
            {!isPro && !isLoading && (
              <div className="mb-4">
                <p className="text-gray-700 mb-2">This feature is only available for Pro users.</p>
                <p className="text-gray-600 text-sm">Upgrade to Pro to unlock:</p>
                <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                  <li>Download resume as PDF</li>
                  <li>Access to premium templates</li>
                  <li>Custom color schemes</li>
                  <li>And many more premium features!</li>
                </ul>
              </div>
            )}
            <button 
              className={`download-btn ${isLoading ? 'opacity-50' : !isPro ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={handleGeneratePDF}
              disabled={isLoading}
            >
              <Download size={16} /> 
              {isLoading ? 'Loading...' : isPro ? 'Download PDF' : 'Upgrade to Download PDF'}
            </button>
          </div>
        </div>
      )}

      <div className={`main-content ${isPrinting ? "printing" : ""}`}>
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
                              style={{ borderColor: activeTemplate.color }}
                              onBlur={(e) => updateSection(section.id, { title: e.target.textContent })}
                            >
                              {section.title}
                            </h3>
                            {!isPrinting && (
                              <div className="section-controls">
                                <div {...provided.dragHandleProps} className="drag-handle">
                                  <Move size={16} />
                                </div>
                                <button onClick={() => removeSection(section.id)} className="delete-btn">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
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
                                {!isPrinting && (
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
                                )}
                              </div>
                            )}

                            {section.type === "list" && section.id === "education" && (
                              <div className="education-list">
                                {section.content.map((item, i) => renderEducationItem(section, item, i))}
                                {!isPrinting && (
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
                                )}
                              </div>
                            )}

                            {section.type === "list" && section.id === "projects" && (
                              <div className="projects-list">
                                {section.content.map((item, i) => renderProjectItem(section, item, i))}
                                {!isPrinting && (
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
                                )}
                              </div>
                            )}

                            {section.type === "tags" && (
                              <div className="skills-container">
                                <div className="skills-list">
                                  {section.content.map((skill, i) => renderSkillTag(section, skill, i))}
                                </div>
                                {!isPrinting && (
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
                                )}
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

export default ResumeCreator

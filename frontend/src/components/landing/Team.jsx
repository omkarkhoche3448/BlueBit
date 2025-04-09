import { useRef, useState, useEffect } from "react";
import { ArrowRight, Linkedin, Instagram, Mail, X } from "lucide-react";

export default function TeamSection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1
    });
  };

  // Function to handle member selection
  const handleSelectMember = (member) => {
    setSelectedMember(member);
  };

  return (
    <section className="py-20 overflow-hidden relative bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] md:w-[800px] md:h-[800px] bg-blue-100/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-100/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={containerRef} onMouseMove={handleMouseMove}>
        <div className="relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <div className="opacity-0 animate-[fadeIn_0.7s_ease-out_forwards]">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600">
                  Our Talented Team
                </span>
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 text-lg">
                The brilliant minds behind our success
              </p>
            </div>
          </div>

          {/* Team members grid - works for both mobile and desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {teamMembers.map((member, idx) => {
              const isHovered = hoveredIndex === idx;
              const delayStyle = {
                animationDelay: `${idx * 0.1}s`
              };
              
              return (
                <div
                  key={idx}
                  className="group relative z-10 h-full opacity-0"
                  style={{
                    animation: 'fadeInUp 0.5s ease-out forwards',
                    ...delayStyle
                  }}
                  onClick={() => handleSelectMember(member)}
                >
                  <div
                    className="h-full cursor-pointer"
                    style={{
                      perspective: '1000px',
                      transform: !isMobile && isHovered
                        ? `rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg)`
                        : "rotateX(0) rotateY(0)",
                      transition: !isMobile && isHovered ? "none" : "transform 0.5s ease-out"
                    }}
                    onMouseEnter={() => !isMobile && setHoveredIndex(idx)}
                    onMouseLeave={() => !isMobile && setHoveredIndex(null)}
                  >
                    <div className="h-full rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100">
                      {/* Image section */}
                      <div className="relative">
                        <div className="relative pb-[125%] bg-gradient-to-br from-blue-50 to-indigo-50">
                          <img 
                            src={member.photo} 
                            alt={member.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          
                          {/* Gradient overlay */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100  group-hover:scale-105 transition-transform duration-700"
                          />
                          
                          {/* Social icons that appear on hover - hidden on mobile */}
                          {!isMobile && (
                            <div 
                              className="absolute bottom-4 left-4 right-4 flex gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-300"
                              >
                                <Linkedin size={16} />
                              </a>
                              <a
                                href={member.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-300"
                              >
                                <Instagram size={16} />
                              </a>
                              <a
                                href={`mailto:${member.email}`}
                                className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-300"
                              >
                                <Mail size={16} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Content section */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </h3>
                        <div className="h-0.5 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 mt-2 mb-2 group-hover:w-16 transition-all duration-300"></div>
                        <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                        
                        {/* View profile button */}
                        <div className={`pt-2 ${!isMobile ? "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" : ""}`}>
                          <button 
                            className={`
                              ${isMobile ? 
                                "flex items-center text-sm font-medium text-blue-600 hover:text-blue-800" : 
                                "flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                              } transition-colors
                            `}
                          >
                            <span>View Profile</span>
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* 3D floating effect elements - desktop only */}
                      {!isMobile && (
                        <>
                          <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-purple-200/40 blur-xl opacity-0 group-hover:opacity-70 transition-opacity"></div>
                          <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-blue-200/40 blur-xl opacity-0 group-hover:opacity-70 transition-opacity"></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <TeamMemberDetailModal 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
        />
      )}
      
      {/* Add CSS keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}

function TeamMemberDetailModal({ member, onClose }) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Add ESC key listener
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{animation: 'fadeIn 0.3s ease-out forwards'}}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{animation: 'zoomIn 0.3s ease-out forwards'}}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white hover:bg-white/30 transition-colors z-10"
        >
          <X size={18} />
        </button>
        
        <div className="md:flex">
          {/* Left side - Image */}
          <div className="md:w-2/5 relative">
            <div className="relative pb-[133%] md:h-full md:pb-0">
              <img
                src={member.photo}
                alt={member.name}
                className="absolute inset-0 w-full h-full object-cover md:static"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/70 to-transparent"></div>
            </div>
            
            <div className="absolute bottom-0 left-0 p-6 text-white md:hidden">
              <h2 className="text-2xl font-bold">{member.name}</h2>
              <p className="text-white/80">{member.position}</p>
            </div>
          </div>
          
          {/* Right side - Content */}
          <div className="md:w-3/5 p-6 md:p-8">
            <div className="hidden md:block mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
              <div className="h-0.5 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 my-2"></div>
              <p className="text-blue-600 font-medium">{member.position}</p>
            </div>
            
            <p className="text-gray-600 mb-6 md:mb-8">{member.bio}</p>
            
            <div className="flex gap-3">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-50 hover:bg-blue-600 p-3 rounded-full text-blue-600 hover:text-white transition-colors duration-300"
              >
                <Linkedin size={18} />
              </a>
              <a
                href={member.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-50 hover:bg-blue-600 p-3 rounded-full text-blue-600 hover:text-white transition-colors duration-300"
              >
                <Instagram size={18} />
              </a>
              <a
                href={`mailto:${member.email}`}
                className="bg-blue-50 hover:bg-blue-600 p-3 rounded-full text-blue-600 hover:text-white transition-colors duration-300"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const teamMembers = [
  {
    name: "Mihir Pande",
    position: "Software Engineer",
    photo: "https://avatars.githubusercontent.com/u/127537487?s=400&u=8e1785c20771a1f829ecfe95cf188907e3d42b89&v=4",
    bio: "Mihir is an exceptional software engineer with experience in full-stack development. He brings unique insights and expertise to our team, helping us deliver outstanding results.",
    linkedin: "https://linkedin.com/in/meeheer123",
    instagram: "https://www.instagram.com/mihir.py",
    email: "mihir.pande@example.com"
  },
  {
    name: "Soham Mhatre",
    position: "Product Manager",
    photo: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
    bio: "Soham is a visionary product manager with a keen eye for market trends and user needs. His strategic thinking helps shape our product roadmap and ensures we deliver value to our customers.",
    linkedin: "#",
    instagram: "#",
    email: "soham.mhatre@example.com"
  },
  {
    name: "Omkar Khoche",
    position: "UI/UX Designer",
    photo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    bio: "Omkar is a talented designer who transforms complex ideas into intuitive and beautiful user experiences. His creative approach ensures our products are both functional and delightful to use.",
    linkedin: "#",
    instagram: "#",
    email: "omkar.khoche@example.com"
  },
  {
    name: "Manthan Barhate",
    position: "Data Scientist",
    photo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
    bio: "Manthan is a data scientist who excels at uncovering insights from complex datasets. His analytical skills drive our data-informed decisions and help us continuously improve our products.",
    linkedin: "#",
    instagram: "#",
    email: "manthan.barhate@example.com"
  },
];
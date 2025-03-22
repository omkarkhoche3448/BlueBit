import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import Header from "./Header"
import Sidebar from "./Sidebar"
import RightSidebar from "./RightSidebar"

function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === "/"

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {isHomePage && !isMobile && (
            <div className="w-full md:w-64 flex-shrink-0">
              <Sidebar />
            </div>
          )}
          <main className="flex-1">{children}</main>
          {isHomePage && !isMobile && (
            <div className="w-full md:w-80 flex-shrink-0">
              <RightSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Layout


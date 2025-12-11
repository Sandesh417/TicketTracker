import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import logo from "../assets/BharatForgeLimited.png";

function Sidebar({ selected, onSelect }) {
  const navigate = useNavigate();
  const [openMaster, setOpenMaster] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const refPanel = useRef(null);

  // Custom simple JWT decode function (no external libs)
  function parseJwt(token) {
    try {
      const base64Payload = token.split(".")[1];
      const payload = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decodeURIComponent(escape(payload)));
    } catch (e) {
      console.error("Failed to parse JWT", e);
      return null;
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setUsername(decoded.username || decoded.name || "");
        setUserRole(decoded.role || "");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Clear token on logout
    navigate("/"); // Redirect to login page
  };

  const getPanelHeight = () => (openMaster && refPanel.current ? refPanel.current.scrollHeight : 0);

  return (
    <div
      className="flex flex-col justify-between bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl"
      style={{ width: "240px", minHeight: "100vh", flexShrink: 0 }}
    >
      <div>
        <div className="flex flex-col items-center justify-center p-4 border-b border-gray-700">
          <img src={logo} alt="Logo" className="h-14 w-auto mb-2" />
          <div className="text-gray-300 pt-2 text-sm">
            {username ? `Welcome ${username}` : "Welcome"}
          </div>
        </div>

        <nav className="flex flex-col mt-2 space-y-1" aria-label="Sidebar Navigation">
          {/* HomePage Button */}
          <button
            className={`px-6 py-3 text-left text-sm font-medium rounded transition-colors duration-300
              ${selected === "dashboard" ? "bg-cyan-600 shadow-md" : "hover:bg-cyan-700"}
            `}
            onClick={() => {
              onSelect("dashboard");
              navigate("/dashboard");
            }}
          >
            HomePage
          </button>

          {/* User Access Management Button */}
          <button
            className={`px-6 py-3 text-left text-sm font-medium rounded transition-colors duration-300
              ${selected === "useraccess" ? "bg-cyan-600 shadow-md" : "hover:bg-cyan-700"}
            `}
            onClick={() => {
              onSelect("useraccess");
              navigate("/useraccess");
            }}
          >
            User Access Management
          </button>

          {/* Conditionally render Master Entry only for Admin */}
          {userRole === "Admin" && (
            <div>
              <button
                className={`
                  px-6 py-3 w-full flex justify-between items-center text-left text-sm font-medium rounded transition-colors duration-300
                  ${openMaster ? "bg-gray-800" : ""}
                  hover:bg-gray-700
                `}
                onClick={() => setOpenMaster(!openMaster)}
                aria-expanded={openMaster}
                aria-controls="master-entry-panel"
              >
                Master Entry
                <FaChevronDown
                  className={`ml-2 transform transition-transform duration-300 ease-in-out
                    ${openMaster ? "rotate-180" : "rotate-0"}
                  `}
                  aria-label="Toggle Master Entry submenu"
                />
              </button>
              <div
                id="master-entry-panel"
                ref={refPanel}
                style={{
                  maxHeight: `${getPanelHeight()}px`,
                  transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className="overflow-hidden bg-gradient-to-b from-gray-900 via-slate-800 to-gray-900"
              >
                <div className="flex flex-col ml-7" role="menu" aria-label="Master entry submenu">
                  <button
                    className={`py-2 my-0.5 text-left text-sm font-medium rounded transition-colors duration-300
                      ${selected === "plant" ? "bg-cyan-600 shadow-md" : "hover:bg-cyan-700"}
                    `}
                    onClick={() => {
                      onSelect("plant");
                      navigate("/plant");
                    }}
                    role="menuitem"
                  >
                    Plant
                  </button>
                  <button
                    className={`py-2 my-0.5 text-left text-sm font-medium rounded transition-colors duration-300
                      ${selected === "project" ? "bg-cyan-600 shadow-md" : "hover:bg-cyan-700"}
                    `}
                    onClick={() => {
                      onSelect("project");
                      navigate("/project");
                    }}
                    role="menuitem"
                  >
                    Project
                  </button>
                  <button
                    className={`py-2 my-0.5 text-left text-sm font-medium rounded transition-colors duration-300
                      ${selected === "shop" ? "bg-cyan-600 shadow-md" : "hover:bg-cyan-700"}
                    `}
                    onClick={() => {
                      onSelect("shop");
                      navigate("/shop");
                    }}
                    role="menuitem"
                  >
                    Shop
                  </button>
                  <button
                    className={`py-2 my-0.5 text-left text-sm font-medium rounded transition-colors duration-300
                      ${selected === "line" ? "bg-cyan-600 shadow-md" : "hover:bg-cyan-700"}
                    `}
                    onClick={() => {
                      onSelect("line");
                      navigate("/line");
                    }}
                    role="menuitem"
                  >
                    Line
                  </button>
                  <button
                    className={`py-2 my-0.5 text-left text-sm font-medium rounded transition-colors duration-300
                      ${selected === "machine" ? "bg-cyan-600 shadow-md" : "hover:bg-cyan-700"}
                    `}
                    onClick={() => {
                      onSelect("machine");
                      navigate("/machine");
                    }}
                    role="menuitem"
                  >
                    Machine
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      <div className="p-5 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-sm font-medium text-white -ml-2 rounded-md transition duration-300 
                hover:bg-gradient-to-r hover:from-red-500 hover:to-red-700 hover:shadow-md"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

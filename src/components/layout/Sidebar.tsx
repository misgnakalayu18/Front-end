// components/layout/Sidebar.tsx (updated with footer)
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button, Layout, Menu, Typography } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { getSidebarItems } from "../../constant/sidebarItems";
import { useAppDispatch } from "../../redux/hooks";
import { logoutUser, getCurrentUser } from "../../redux/services/authSlice";
import { useSelector } from "react-redux";

const { Content, Sider } = Layout;
const { Text } = Typography;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutBtn, setShowLogoutBtn] = useState(true);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useSelector(getCurrentUser);
  const role = user?.role || "USER";
  const items = getSidebarItems(role);

  const handleClick = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <Layout style={{ height: "100vh", position: "relative" }}>
      {/* === Toggle Sidebar Button === */}
      <Button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 999,
          background: "#164863",
          color: "white",
        }}
      >
        {collapsed ? "☰" : "✕"}
      </Button>

      {/* === SIDEBAR === */}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        onCollapse={(value) => {
          setCollapsed(value);
          setShowLogoutBtn(!value);
        }}
        width="220px"
        collapsedWidth="0"
        style={{
          backgroundColor: "#164863",
          position: "relative",
          transition: "0.3s",
        }}
      >
        <h1
          style={{
            color: "#0707b4ff",
            padding: "1rem",
            marginTop: "2rem",
            textAlign: "center",
            fontFamily:"times new roman",
            fontWeight: "large",
            fontSize: "1.5rem",
            backgroundColor: "#2377c0ff",
          }}
        >
          PILLAR IMS
        </h1>

        <Menu
          theme="dark"
          mode="inline"
          style={{ backgroundColor: "#164863", fontWeight: "700" }}
          items={items}
        />

        {showLogoutBtn && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              padding: "1rem",
            }}
          >
            <Button
              type="primary"
              style={{
                width: "100%",
                backgroundColor: "#4150a6ff",
                fontWeight: 800
              }}
              onClick={handleClick}
            >
              <LogoutOutlined />
              Logout
            </Button>
          </div>
        )}
      </Sider>

      {/* === MAIN CONTENT === */}
      <Layout style={{ position: "relative" }}>
        <Content style={{ 
          padding: "2rem", 
          background: "#368cc5ff",
          position: "relative",
          minHeight: "100vh"
        }}>
          <div
            style={{
              padding: "1rem",
              background: "#fff",
              borderRadius: "1rem",
              minHeight: "calc(100vh - 4rem - 30px)", // Account for footer
              position: "relative"
            }}
          >
            <Outlet />
            
            {/* ===== DEVELOPER CONTACT FOOTER ===== */}
            {/* This will only show on routes that use Sidebar (protected routes) */}
            <div style={{
              position: "absolute",
              bottom: "-2rem", // Position it at the bottom of the white content box
              left: "1rem",
              right: "1rem",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
              transition: "opacity 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
            }}>
              <Text style={{ 
                color: "rgba(54, 140, 197, 0.6)", // Matching your #368cc5ff
                fontSize: "11px",
                fontWeight: 300,
                letterSpacing: "0.3px",
                fontFamily: "'Nunito', sans-serif"
              }}>
                <a 
                  href="tel:+251927776614"
                  style={{
                    color: "rgba(54, 140, 197, 0.6)",
                    textDecoration: "none",
                    marginRight: "16px",
                    fontWeight: 300,
                    transition: "color 0.2s",
                    padding: "2px 6px",
                    borderRadius: "2px",
                    border: "0.5px solid rgba(54, 140, 197, 0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "rgba(54, 140, 197, 0.8)";
                    e.currentTarget.style.backgroundColor = "rgba(54, 140, 197, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(54, 140, 197, 0.6)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  +251 927 776 614
                </a>
                
                <span style={{ 
                  margin: "0 8px",
                  color: "rgba(54, 140, 197, 0.3)",
                  fontSize: "10px"
                }}>•</span>
                
                <a 
                  href="mailto:kalayumisgna@gmail.com"
                  style={{
                    color: "rgba(54, 140, 197, 0.6)",
                    textDecoration: "none",
                    marginLeft: "8px",
                    fontWeight: 300,
                    transition: "color 0.2s",
                    padding: "2px 6px",
                    borderRadius: "2px",
                    border: "0.5px solid rgba(54, 140, 197, 0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "rgba(54, 140, 197, 0.8)";
                    e.currentTarget.style.backgroundColor = "rgba(54, 140, 197, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(54, 140, 197, 0.6)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  kalayumisgna@gmail.com
                </a>
              </Text>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
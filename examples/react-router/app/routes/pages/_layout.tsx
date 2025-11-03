// app/routes/__root.tsx
import { Outlet, Link, useNavigate } from "react-router";
import { BetterStackProvider } from "@btst/stack/context"
import type { BlogPluginOverrides } from "@btst/stack/plugins/blog/client"

// Get base URL function - works on both server and client
// On server: uses process.env.BASE_URL
// On client: uses import.meta.env.VITE_BASE_URL or falls back to window.location.origin (which will be correct)
const getBaseURL = () => 
    typeof window !== 'undefined' 
      ? (import.meta.env.VITE_BASE_URL || window.location.origin)
      : (process.env.BASE_URL || "http://localhost:5173")
  
  // Define the shape of all plugin overrides
  type PluginOverrides = {
      blog: BlogPluginOverrides,
  }

export default function Layout() {
    
    const baseURL = getBaseURL()
    const navigate = useNavigate()
  return (
    
            <BetterStackProvider<PluginOverrides>
                basePath="/pages"
                overrides={{
                    blog: {
                        apiBaseURL: baseURL,
                        apiBasePath: "/api/data",
                        navigate: (href) => navigate(href),
                        uploadImage: async (file) => {
                            console.log("uploadImage", file)
                            return "https://placehold.co/400/png"
                        },
                        Link: ({ href, children, className, ...props }) => (
                            <Link to={href} className={className} {...props}>
                              {children}
                            </Link>
                        ),
                    }
                }}
            >
                <Outlet />
            </BetterStackProvider>
            
  );
}

import { Button } from "@/components/ui/button";
import { FileText, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../../Context/UserContext";

const Header = () => {
  const location=useLocation();
  const user=useContext(UserContext);
  const [admin, setAdmin] = useState(null);
  useEffect(()=>{
    setAdmin(user)
  }, [user])
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/citizen"
            className="flex items-center gap-3 group transition-all"
          >
            <div className="p-2 rounded-xl bg-gray-900 group-hover:bg-gray-800 transition-colors">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
              eGov Portal
            </span>
          </Link>
          {admin && (
            <div className="hidden sm:flex flex-col ml-4">
              <span className="text-sm font-medium text-gray-900">
                {admin.name}
              </span>
              <a
                className="text-xs text-gray-500"
                href={`mailto:${admin.email}`}
              >
                {admin.email}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full w-10 h-10 hover:bg-gray-100 transition-all"
            >
              <Link to="/citizen/profile">
                <User className="w-5 h-5 text-gray-700" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full w-10 h-10 hover:bg-gray-100 transition-all"
            >
              <Link to="/citizen/settings">
                <Settings className="w-5 h-5 text-gray-700" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

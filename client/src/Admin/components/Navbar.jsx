"use client";
import { LogOut } from "lucide-react";
import { useContext } from "react";
import { UserContext } from "../../Context/UserContext";

function Navbar() {
    const user=useContext(UserContext);
  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900">
          E-Governance Platform
        </h1>
        <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
          Admin Panel
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.user.name}</p>
          <p className="text-xs text-gray-500">{user.user.email}</p>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

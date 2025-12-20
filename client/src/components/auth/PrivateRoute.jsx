import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../Context/UserContext";
import Loader from "../ui/Loader";

const PrivateRoute = ({ children, requiredRole, apiEndpoint, storageKey }) => {
  const { setuser } = useContext(UserContext);
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiEndpoint();
        if (response.data?.user?.role === requiredRole) {
          setuser(response.data.user);
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(response.data.user));
          }
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authenticated === false) {
      navigate("/login");
    }
  }, [authenticated, navigate]);

  if (authenticated === null) {
    return <Loader />;
  }

  if (authenticated) {
    return children;
  }

  return null;
};

export default PrivateRoute;


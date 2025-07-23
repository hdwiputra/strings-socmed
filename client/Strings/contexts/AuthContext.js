import { createContext, useEffect, useState } from "react";
import { getSecure } from "../helpers/secureStore";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const access_token = await getSecure("access_token");
      if (access_token) setIsSignedIn(true);
    };
    checkToken();
  }, []);

  return (
    <AuthContext value={{ isSignedIn, setIsSignedIn }}>{children}</AuthContext>
  );
}

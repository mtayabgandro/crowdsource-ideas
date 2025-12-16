import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Helper function to get full avatar URL with backend prefix
  const getFullAvatarUrl = (avatar) => {
    if (!avatar || !avatar.trim()) {
      // Return a simple SVG data URL for default avatar
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4NWMwLTE1IDEyLjUtMjcuNSAyNy41LTI3LjVzMjcuNSAxMi41IDI3LjUgMjcuNSIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
    }
    if (avatar.startsWith('http') || avatar.startsWith('data:')) {
      return avatar;
    }
    return `http://localhost:5000${avatar}`;
  };

  // Initialize auth state from token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          const decoded = jwtDecode(storedToken);
          
          // Verify token is not expired
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('avatar');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }

          setToken(storedToken);
          
          // Fetch fresh user data
          try {
            const userResponse = await axios.get(`http://localhost:5000/api/auth/profile`);
            const userData = userResponse.data.user;
            const fullAvatarUrl = getFullAvatarUrl(userData.avatar);

            // Save avatar URL to localStorage
            if (userData.avatar) {
              localStorage.setItem('avatar', fullAvatarUrl);
            } else {
              localStorage.removeItem('avatar');
            }
            setUser({ ...userData, avatar: fullAvatarUrl });
          } catch (error) {
            console.error('Error fetching user data:', error);
            // If user fetch fails, set basic user info from token
            const fullAvatarUrl = getFullAvatarUrl(decoded.avatar);
            if (decoded.avatar) {
              localStorage.setItem('avatar', fullAvatarUrl);
            } else {
              localStorage.removeItem('avatar');
            }
            setUser({
              _id: decoded.userId,
              username: decoded.username,
              avatar: fullAvatarUrl
            });
          }
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('avatar');
          setToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      
      const { token: newToken, user: userData } = response.data;
      const fullAvatarUrl = getFullAvatarUrl(userData.avatar);
      
      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Save avatar URL to localStorage
      if (userData.avatar) {
        localStorage.setItem('avatar', fullAvatarUrl);
      } else {
        localStorage.removeItem('avatar');
      }
      
      // Set user data
      setUser({ ...userData, avatar: fullAvatarUrl });
      
      return { success: true, user: { ...userData, avatar: fullAvatarUrl } };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', { 
        username, 
        email, 
        password 
      });
      
      const { token: newToken, user: userData } = response.data;
      const fullAvatarUrl = getFullAvatarUrl(userData.avatar);
      
      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Save avatar URL to localStorage
      if (userData.avatar) {
        localStorage.setItem('avatar', fullAvatarUrl);
      } else {
        localStorage.removeItem('avatar');
      }
      
      // Set user data
      setUser({ ...userData, avatar: fullAvatarUrl });
      
      return { success: true, user: { ...userData, avatar: fullAvatarUrl } };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('avatar');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUserData) => {
    setUser(prevUser => {
      if (!prevUser) return updatedUserData;

      const newAvatar = updatedUserData.avatar ? getFullAvatarUrl(updatedUserData.avatar) : prevUser.avatar;
      if (updatedUserData.avatar) {
        localStorage.setItem('avatar', newAvatar);
      }
      
      return {
        ...prevUser,
        ...updatedUserData,
        avatar: newAvatar,
        // Ensure socialLinks are merged properly
        socialLinks: {
          ...prevUser.socialLinks,
          ...updatedUserData.socialLinks
        }
      };
    });
  };

  const refreshUser = async () => {
    if (!user?._id) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/users/${user._id}`);
      const userData = response.data;
      const fullAvatarUrl = getFullAvatarUrl(userData.avatar);

      if (userData.avatar) {
        localStorage.setItem('avatar', fullAvatarUrl);
      } else {
        localStorage.removeItem('avatar');
      }
      setUser({ ...userData, avatar: fullAvatarUrl });
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const updateToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const isAuthenticated = !!token && !!user;

  // Auto-logout when token expires
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      
      if (expiresIn <= 0) {
        logout();
        return;
      }

      const timeout = setTimeout(() => {
        logout();
      }, expiresIn);

      return () => clearTimeout(timeout);
    } catch (error) {
      console.error('Error decoding token for auto-logout:', error);
      logout();
    }
  }, [token]);

  const value = {
    // State
    user,
    token,
    loading,
    
    // Authentication actions
    login,
    register,
    logout,
    
    // User management
    updateUser,
    refreshUser,
    updateToken,
    
    // Status
    isAuthenticated,
    
    // Helpers
    getFullAvatarUrl,

    // Permissions
    canEdit: (resourceUserId) => {
      return user && (user._id === resourceUserId || user.role === 'admin' || user.role === 'moderator');
    },
    
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
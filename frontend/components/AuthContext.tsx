"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, UserProfile } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any, role: "student" | "lecturer") => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const response = await apiClient.auth.getMe();
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem("access_token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.auth.login({ email, password });
      console.log(response.data);
      localStorage.setItem("access_token", response.data.access_token);
      //setUser(response.data.user);

      notifications.show({
        title: "Success",
        message: "Logged in successfully",
        color: "green",
      });

      if (response.data.role === "student") {
        router.push("/dashboard/student");
      } else if (response.data.role === "lecturer") {
        router.push("/dashboard/lecturer");
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      router.push("/login");
      notifications.show({
        title: "Logged out",
        message: "You have been logged out successfully",
        color: "blue",
      });
    }
  };

  const register = async (data: any, role: "student" | "lecturer") => {
    try {
      const response =
        role === "student"
          ? await apiClient.auth.registerStudent(data)
          : await apiClient.auth.registerLecturer(data);

      //localStorage.setItem('access_token', response.data.access_token);
      //setUser(response.data.user);

      notifications.show({
        title: "Success",
        message: "Account created successfully",
        color: "green",
      });

      router.push("/login");
      /*router.push(
        role === "student" ? "/dashboard/student" : "/dashboard/lecturer"
      );*/
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const response = await apiClient.auth.updateProfile(data);
      setUser(response.data);
      notifications.show({
        title: "Success",
        message: "Profile updated successfully",
        color: "green",
      });
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

"use client";

const TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "authRefreshToken";
const USER_KEY = "authUser";

const setCookie = (name, value, days = 7) => {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
};

export const saveToken = (token) => {
  if (typeof window !== "undefined" && token) {
    localStorage.setItem(TOKEN_KEY, token);
    setCookie(TOKEN_KEY, token);
  }
};

export const saveRefreshToken = (refreshToken) => {
  if (typeof window !== "undefined" && refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setCookie(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const saveUser = (user) => {
  if (typeof window !== "undefined" && user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCookie(USER_KEY, JSON.stringify(user));
  }
};

export const getUser = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    deleteCookie(TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_KEY);
  }
};

export const isLoggedIn = () => Boolean(getToken());

export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};

export const getUserPermissions = () => {
  const user = getUser();
  return user?.permissions || [];
};

export const hasPermission = (permission) => {
  const user = getUser();
  if (!user || !user.permissions) return false;
  if (user.role === "superadmin") return true;
  return user.permissions.includes(permission);
};

export const isSuperAdmin = () => {
  return getUserRole() === "superadmin";
};

export const isAdmin = () => {
  const role = getUserRole();
  return role === "admin" || role === "superadmin";
};

export const isUser = () => {
  return getUserRole() === "customer" || getUserRole() === "user";
};

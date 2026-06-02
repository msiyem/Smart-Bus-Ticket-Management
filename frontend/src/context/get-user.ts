"use server";

import { getCookie } from "@/lib/cookies";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  userId: number;
  role: string;
  username?:string;
  email: string;
  name?: string;
  expiresIn?: number;
};

export const getUser = async () => {
  try {
    const accessToken = await getCookie("accessToken");

    if (!accessToken) {
      return null;
    }

    const decoded = jwtDecode<DecodedToken>(accessToken);

    if (decoded.expiresIn && decoded.expiresIn * 1000 < Date.now()) {
      return null;
    }

    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      username: decoded.username,
    };
  } catch {
    return null;
  }
};
"use server";

import { serverRequest } from "@/action/server-request.action";
import type { Operator, Bus, Schedule } from "@/lib/types";

type ActionResult<T = null> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type CreateOperatorPayload = {
  owner_user_id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

export const createOperatorAction = async (
  payload: CreateOperatorPayload,
): Promise<ActionResult<{ operatorId: number }>> => {
  try {
    return await serverRequest<ActionResult<{ operatorId: number }>>(
      "operators",
      { method: "POST", auth: true, body: JSON.stringify(payload) },
    );
  } catch (error) {
    console.error("Error creating operator:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create operator",
    };
  }
};

export const listOperatorsAction = async (): Promise<
  ActionResult<Operator[]>
> => {
  try {
    return await serverRequest<ActionResult<Operator[]>>("operators", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error listing operators:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to list operators",
    };
  }
};

export const getOperatorAction = async (
  operatorId: number,
): Promise<ActionResult<Operator>> => {
  try {
    return await serverRequest<ActionResult<Operator>>(
      `operators/${operatorId}`,
      { method: "GET", auth: true },
    );
  } catch (error) {
    console.error("Error fetching operator:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch operator",
    };
  }
};

export const getMyOperatorAction = async (): Promise<
  ActionResult<Operator>
> => {
  try {
    return await serverRequest<ActionResult<Operator>>("operators/me", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching my operator:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my operator",
    };
  }
};

export type UpdateOperatorPayload = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export const updateOperatorAction = async (
  operatorId: number,
  payload: UpdateOperatorPayload,
): Promise<ActionResult<{ operatorId: number }>> => {
  try {
    return await serverRequest<ActionResult<{ operatorId: number }>>(
      `operators/${operatorId}`,
      { method: "PUT", auth: true, body: JSON.stringify(payload) },
    );
  } catch (error) {
    console.error("Error updating operator:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update operator",
    };
  }
};

export const deleteOperatorAction = async (
  operatorId: number,
): Promise<ActionResult<{ operatorId: number }>> => {
  try {
    return await serverRequest<ActionResult<{ operatorId: number }>>(
      `operators/${operatorId}`,
      { method: "DELETE", auth: true },
    );
  } catch (error) {
    console.error("Error deleting operator:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete operator",
    };
  }
};

export const getOperatorBusesAction = async (
  operatorId: number,
): Promise<ActionResult<Bus[]>> => {
  try {
    return await serverRequest<ActionResult<Bus[]>>(
      `operators/${operatorId}/buses`,
      { method: "GET", auth: true },
    );
  } catch (error) {
    console.error("Error fetching operator buses:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch operator buses",
    };
  }
};

export const getOperatorSchedulesAction = async (
  operatorId: number,
): Promise<ActionResult<Schedule[]>> => {
  try {
    return await serverRequest<ActionResult<Schedule[]>>(
      `operators/${operatorId}/schedules`,
      { method: "GET", auth: true },
    );
  } catch (error) {
    console.error("Error fetching operator schedules:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch operator schedules",
    };
  }
};

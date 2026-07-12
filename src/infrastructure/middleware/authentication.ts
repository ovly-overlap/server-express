import jwt from "jsonwebtoken";
import { Request } from "express";
import { JwtPayload } from "../types/JwtPayload.js";
import { ValidateError } from "@tsoa/runtime";
import { AppError, BadRequestError, UnauthorizedError } from "../types/appError.js";

export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "jwt") {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new BadRequestError("auth header가 없음");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError;
    }

    try {
      const payload = jwt.verify(token, process.env.SECRET_KEY!) as JwtPayload;
      (request as any).user = payload;
      return payload;
    } catch (error) {
      throw new UnauthorizedError("payload 인증 과정 오류")
    }
  }
}
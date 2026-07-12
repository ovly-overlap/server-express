import jwt from "jsonwebtoken";
import { Request } from "express";
import { JwtPayload } from "../types/JwtPayload.js";

export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "jwt") {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new Error("Unauthorized");
    }

    try {
      const payload = jwt.verify(token, process.env.SECRET_KEY!) as JwtPayload;
      (request as any).user = payload;
      return payload;
    } catch (error) {
      throw new Error("Unauthorized");
    }
  }

  throw new Error("Unauthorized");
}
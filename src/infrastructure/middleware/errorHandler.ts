// middleware/errorHandler.ts

import { ValidateError } from "@tsoa/runtime";
import { AppError } from "../types/appError.js";
import { NextFunction, Request, Response } from "express";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {

  console.error(err);

  // tsoa Validation
  if (err instanceof ValidateError) {
    return res.status(422).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "입력값이 올바르지 않습니다.",
      details: err.fields,
    });
  }

  // 우리가 만든 Error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  // 예상 못한 에러

  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "서버 내부 오류",
  });
}
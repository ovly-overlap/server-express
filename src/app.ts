import 'dotenv/config';
import 'module-alias/register';
import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import sequelize from "@/infrastructure/models/index.js";
import rateLimiter from "@/infrastructure/middleware/rateLimiter.js";
import { NewsSyncJob } from "./domain/news/news-sync.job.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./tsoa/swagger.json" with { type: "json" };
import { startNewsCron } from "./domain/news/news.cron.js";
import { RegisterRoutes } from "./tsoa/routes.js";
import cors from "cors";
import { ValidateError } from "@tsoa/runtime";
import { errorHandler } from './infrastructure/middleware/errorHandler.js';

// 1. 데이터베이스 연결
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("✅ DB Connected!");
  })
  .catch((err: Error) => {
    console.error(err);
  });

const app = express();
const newsSyncJob = new NewsSyncJob();
const isNewsSyncEnabled = process.env.NEWS_SYNC_ENABLED !== "false";
const shouldRunNewsSyncOnStart = process.env.NEWS_SYNC_ON_START !== "false";

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// TSOA가 라우팅을 하기 전에 반드시 JSON 파서와 쿠키 파서가 먼저 작동해야 합니다!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);

RegisterRoutes(app);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(errorHandler);

// if (isNewsSyncEnabled) {
//   startNewsCron();
// }

// 5. 에러 핸들링 미들웨어 (맨 아래 유지)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ValidateError) {
    console.error(`Caught Validation Error for ${req.path}:`, JSON.stringify(err.fields));
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }

  // 기타 서버 에러 처리 (필요시 추가)
  console.error("Internal Server Error:", err);
  return res.status(500).json({ message: "Internal Server Error" });
});

// 6. 서버 가동
app
  .listen(process.env.PORT, async () => {
    console.log(`
    ################################################
        🛡️  Server listening on port ${process.env.PORT} 🛡️
    ################################################
  `);
    if (isNewsSyncEnabled && shouldRunNewsSyncOnStart) {
      try {
        await newsSyncJob.execute();
      } catch (error) {
        console.error(
          "Initial news sync failed:",
          error instanceof Error ? error.message : error
        );
      }
    }
  })
  .on("error", (err) => {
    console.error(err);
    process.exit(1);
  });

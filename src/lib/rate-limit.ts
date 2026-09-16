import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "lodgeos:auth:",
});

export const registrationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, "1 h"),
  prefix: "lodgeos:register:",
});
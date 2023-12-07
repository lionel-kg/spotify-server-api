import Redis from 'ioredis';
const redis = new Redis({enableAutoPipelining: true});

const redisMiddleware = async (req, res, next) => {
  // try {
  //   const cachedData = await redis.get(req.originalUrl);
  //   if (cachedData) {
  //     res.status(200).json(JSON.parse(cachedData));
  //   } else {
  //     next();
  //   }
  // } catch (error) {
  //   console.error('Cache error:', error);
  //   next();
  // }
  next();
};

export default redisMiddleware;

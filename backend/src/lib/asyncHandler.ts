import { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 does not catch rejected promises from async handlers - an
// unhandled rejection would otherwise crash the whole process (Node
// terminates on unhandled rejection by default). Every async route must go
// through this so one bad request can never take the server down.
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
}

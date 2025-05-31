class HeaderPopulationMiddleware {
  populateHeaders(req, res, next) {
    try {
      if (req.currentUser && req.currentUser._id) {
        req.headers['X-User-ID'] = req.currentUser._id.toString();

        console.log(
          `[API Gateway - HeaderPopulation] Headers poblados: X-User-ID=${req.headers['X-User-ID']}`
        );
      }
      next();
    } catch (error) {
      console.error('[API Gateway - HeaderPopulation] Error al poblar headers:', error);
      if (!res.headersSent) {
      }
      next(error);
    }
  }
}

const instance = new HeaderPopulationMiddleware();
const populateHeadersMiddleware = instance.populateHeaders.bind(instance);

export { populateHeadersMiddleware as populateHeaders };

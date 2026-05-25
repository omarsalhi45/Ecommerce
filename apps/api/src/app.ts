import cors from 'cors'
import express from 'express'
import { apiConfig } from './config'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware'
import { requestLogger } from './middleware/requestLogger'
import { initializeMonitoring, monitoringErrorHandler } from './monitoring'
import router from './routes'

const app = express()

app.disable('etag')
initializeMonitoring()

app.use(requestLogger)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())
app.use(
  cors({
    origin: apiConfig.corsOrigins,
  })
)
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})
app.use('/api', router)

app.get('/', (_, res) => {
  res.json({ status: 'ok', service: 'OSAI API' })
})

app.use(notFoundHandler)
app.use(monitoringErrorHandler)
app.use(errorHandler)

export default app

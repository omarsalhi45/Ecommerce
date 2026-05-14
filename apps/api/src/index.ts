import app from './app'
import { apiConfig } from './config'

const { port } = apiConfig

app.listen(port, () => {
  console.log(`OSAI API is running on http://localhost:${port}`)
})

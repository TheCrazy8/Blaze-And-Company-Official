import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
app.use(express.json())

const CLIENT_ID = process.env.GITHUB_CLIENT_ID
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'

// CORS: allow only the configured frontend origin in production
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))

if (!CLIENT_ID) {
  console.warn('Warning: GITHUB_CLIENT_ID not set. Device flow will fail without a client id.')
}

// POST /device/start
// forwards to https://github.com/login/device/code
app.post('/device/start', async (req, res) => {
  try {
    if (!CLIENT_ID) {
      return res.status(500).json({ message: 'GITHUB_CLIENT_ID is not configured' })
    }
    const scope = req.body?.scope || 'public_repo'
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope
    })

    const ghRes = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: params.toString()
    })

    const json = await ghRes.json().catch(async () => {
      const text = await ghRes.text().catch(() => '')
      return { _raw: text }
    })

    return res.status(ghRes.status).json(json)
  } catch (err) {
    console.error('device/start error', err)
    return res.status(500).json({ message: String(err) })
  }
})

// POST /device/poll
// forwards to https://github.com/login/oauth/access_token
app.post('/device/poll', async (req, res) => {
  try {
    if (!CLIENT_ID) {
      return res.status(500).json({ message: 'GITHUB_CLIENT_ID is not configured' })
    }
    const { device_code } = req.body || {}
    if (!device_code) return res.status(400).json({ message: 'device_code required' })

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })

    const ghRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: params.toString()
    })

    const json = await ghRes.json().catch(async () => {
      const text = await ghRes.text().catch(() => '')
      return { _raw: text }
    })

    return res.status(ghRes.status).json(json)
  } catch (err) {
    console.error('device/poll error', err)
    return res.status(500).json({ message: String(err) })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Device-flow backend listening on port ${port}`)
})

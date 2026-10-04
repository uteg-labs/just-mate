import { app } from "./app"
import { startMatchScoreSweep } from "./matching/sweep"

const port = Number(process.env.PORT || 3000)

app.listen(port)
startMatchScoreSweep()

console.log(`server on ${app.server?.url}`)
